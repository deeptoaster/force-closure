function ClosurePresenter() {
	const padding = 0.6;
	const mu = 15;
	var self = this;
	var top;
	var right;
	var bottom;
	var left;
	var $grid;

	this.center = function(init) {
		var h = $('#game').height();
		var w = $('#game').width();
		var fs = 1 / Math.max((top - bottom) / (h * padding), (right - left) /
				(w * padding));

		var css = {
			top: h / 2 + (top + bottom) * fs / 2 + 'px',
			left: w / 2 - (right + left) * fs / 2 + 'px'
		};

		$('#game').css({
			fontSize: fs,
			backgroundPosition: css.left + ' ' + css.top
		});

		$grid.css(css);

		if (init) {
			setTimeout('$(\'#game\').addClass(\'active\');', 400);
		}
	};

	this.updateEdge = function(n0, side) {
        n0.$node.children().css({
			width: n0.width + 'em',
			transform: 'rotate(' + -n0.theta + 'rad)'
		}).children().css('transform', function() {
			var t = 90 + ($(this).hasClass('in') ? -self.model.getMu() :
					self.model.getMu());

			return 'rotate(' + ($(this).hasClass('left') ? t : -t) + 'deg)';
		});

		if (side) {
			n0.$node.addClass(side);
		}
	};

	this.toggleGrasp = function(show) {
		$('.node.grasp .edge').toggleClass('active', show);
	}

	this.graphLines = function(m, b0, b1, w0, w1, s0, t0, s1, t1) {
		var x0 = 0;
		var y0 = 0;
		var x1 = 0;
		var y1 = 0;
		var w = $('.graph').width();
		var h = $('.graph').height();
		var max = Math.max(w0, w1)

		if (b0 < 0) {
			x0 = -b0 / m * w / max;
		} else {
			y0 = b0 * h / max;
		}

		if (b1 < 0) {
			y1 = -b1 / m * w / max;
		} else {
			x1 = b1 * h / max;
		}

		var t = Math.atan(m);
		var wp = w0 * w / max;
		var hp = w1 * h / max;
		var d0 = Math.min((wp - x0) / Math.cos(t), (hp - y0) / Math.sin(t));
		var d1 = Math.min((wp - x1) / Math.sin(t), (hp - y1) / Math.cos(t));

		$('.graph').empty().append('<span class="edge" /><span class="edge" />'
				+ '<span class="box" />').children().first().css({
			top: h - y0,
			left: x0,
			width: d0,
			transform: 'rotate(' + -t + 'rad)'
		}).next().css({
			top: h - y1,
			left: x1,
			width: d1,
			transform: 'rotate(' + (t - Math.PI / 2) + 'rad)'
		}).next().css({
			top: h - s1 * h / max - 1,
			right: w - s0 * w / max - 1,
			bottom: t1 * h / max - 1,
			left: t0 * w / max - 1,
		});
	}

	this.createNode = function(node, i, grasp) {
        node.$node = $('<span class="node"><span class="edge" /></span>');

        if (grasp) {
			node.$node.addClass('grasp').children()
					.append('<span class="left in" />' +
					'<span class="left out" /><span class="right in" />' +
					'<span class="right out" />');
		}

		this.updateNode(node);
		node.$node.appendTo($grid)
		node.$node[0].node = node;

		if (!grasp) {
			node.$input = $('<li class="vertex"><button class="remove">&times;'
				+ '</button> (<input type="number" class="x" value="' + node.x
				+ '" step="0.01" />, <input type="number" class="y" value="' +
				node.y + '" step="0.01" />)</li>');
			node.$input[0].node = node;

			if (i) {
				node.$input.insertAfter('#nodes > :nth-child(' + i + ')');
			} else {
				node.$input.prependTo('#nodes');
			}
		}
	};

	this.destroyNode = function(node) {
		node.$input.remove();
		node.$node.remove();
	};

	this.updateNode = function(node) {
		top = Math.max(top, node.y);
		right = Math.max(right, node.x);
		bottom = Math.min(bottom, node.y);
		left = Math.min(left, node.x);

		node.$node.css({
			top: -node.y + 'em',
			left: node.x + 'em'
		});
	};

	this.init = function() {
        top = -Infinity;
        right = -Infinity;
        bottom = Infinity;
        left = Infinity;

		$grid = $('<div class="grid" />').appendTo('#game').on('click',
				'.node:not(.grasp) .edge', function() {
			var node = $(this).parent()[0].node;

			if ($(this).hasClass('active')) {
				self.model.removeGrasp(node);
				$(this).removeClass('active');
			} else if (self.model.addGrasp(node)) {
				$(this).addClass('active');
			}
		});

		$('#nodes').on('click', '.remove', function() {
			self.model.removeNode($(this).parent()[0].node);
		}).on('change', '.x, .y', function() {
			var t = parseFloat($(this).val());
			var attr = $(this).hasClass('x') ? 'x' : 'y';
			var $parent = $(this).parent();

			if (isNaN(t)) {
				t = $parent[0].node[attr];
			}

			$(this).val(t);
			self.model.moveNode($parent[0].node, $parent.children('.x').val(),
					$parent.children('.y').val());
		}).on('focus', '.x, .y', function() {
			$(this).parent()[0].node.$node.addClass('active');
		}).on('blur', '.x, .y', function() {
			$(this).parent()[0].node.$node.removeClass('active')
		});

		$('#add').click(function() {
			self.model.appendNode();
			$('#nodes > :last-child .x').focus();
		});

		$('#mu').change(function() {
			var t = parseFloat($(this).val());

			if (isNaN(t)) {
				t = self.model.getMu();
			}

			$(this).val(t);
			self.model.setMu(t);
		}).val(mu).change();
	};
}
