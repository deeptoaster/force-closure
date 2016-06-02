function Node(x, y) {
	this.x = x;
	this.y = y;
	this.theta = 0;
	this.width = 0;
}

function Closure(presenter) {
	var self = this;
	var friction;
	var grasp;
	var nodes;
	var g0;
	var g1;

	function lerp(n0, n1, t) {
		return {
			x: n0.x * (1 - t) + n1.x * t,
			y: n0.y * (1 - t) + n1.y * t
		};
	}

	function updateEdge(n0, n1) {
        var a = n1.x - n0.x;
        var b = n0.y - n1.y;

        n0.theta = -Math.atan(b / a);
        n0.width = Math.sqrt(a * a + b * b);

        if (a < 0) {
            n0.theta -= Math.PI;
        }

		presenter.updateEdge(n0);
	}

	function updateEdges(i) {
		i = (i + nodes.length) % nodes.length;

		if (nodes.length) {
			updateEdge(nodes[(i + nodes.length - 1) % nodes.length],
					nodes[i]);
			updateEdge(nodes[i], nodes[(i + 1) % nodes.length]);
		}
	}

	this.addGrasp = function(node) {
		if (grasp.length >= 2) {
			return false;
		}

		grasp.push(node);
		self.updateGrasp();
		return true;
	}

	this.removeGrasp = function(node) {
		grasp.splice(grasp.indexOf(node), 1);
		self.updateGrasp();
	}

	this.updateGrasp = function() {
		presenter.toggleGrasp(false);

		if (grasp.length == 2) {
			var t = grasp[0].theta - grasp[1].theta - Math.PI

			if (t < -Math.PI) {
				t += 2 * Math.PI;
			}

			if (t < 0) {
				t = -t;
				grasp.reverse();
			}

			if (t >= friction * 2 || !grasp[0].width || !grasp[1].width) {
				return false;
			}

			var n0 = nodes[(nodes.indexOf(grasp[0]) + 1) % nodes.length];
			var n1 = nodes[(nodes.indexOf(grasp[1]) + 1) % nodes.length];
			var f0 = grasp[0].theta - Math.PI / 2 - friction;
			var d0 = Math.sin(f0 - grasp[1].theta + Math.PI);
			var b0 = ((n1.y - grasp[0].y) * Math.cos(f0) - (n1.x - grasp[0].x)
					* Math.sin(f0)) / d0;
			var f1 = grasp[1].theta - Math.PI / 2 + friction;
			var d1 = Math.sin(f1 - grasp[0].theta);
			var b1 = ((grasp[0].y - n1.y) * Math.cos(f1) - (grasp[0].x - n1.x)
					* Math.sin(f1)) / d1;
			var m = Math.sin(f0 - grasp[0].theta) / d0;
			var p0 = grasp[1].width - ((n0.x - n1.x) * (grasp[1].x - n1.x) +
					(n0.y - n1.y) * (grasp[1].y - n1.y)) / grasp[1].width;
			var p1 = grasp[0].width - ((grasp[1].x - grasp[0].x) * (n0.x -
					grasp[0].x) + (grasp[1].y - grasp[0].y) * (n0.y -
					grasp[0].y)) / grasp[0].width;
			var s0 = p0 < p1 ? Math.min((Math.max(m * grasp[1].width + b1, 0) +
					grasp[1].width - b0) / (m + 1), grasp[0].width) :
					grasp[0].width;
			var s1 = p1 < p0 ? Math.min((Math.max(m * grasp[0].width + b0, 0) +
					grasp[0].width - b1) / (m + 1), grasp[1].width) :
					grasp[1].width;
			var t0 = Math.max((m * s1 + b1) / grasp[0].width, 0);
			var t1 = Math.max((m * s0 + b0) / grasp[1].width, 0);
			var h0 = lerp(grasp[0], n0, t0);
			var h1 = lerp(n1, grasp[1], s1 / grasp[1].width);

			g0.x = h0.x;
			g0.y = h0.y;
			g1.x = h1.x;
			g1.y = h1.y;
			presenter.updateNode(g0);
			presenter.updateNode(g1);
			updateEdge(g0, lerp(grasp[0], n0, s0 / grasp[0].width));
			updateEdge(g1, lerp(n1, grasp[1], t1));
			presenter.toggleGrasp(true);
			return true;
		}
	}

	this.appendNode = function(x, y, grasp) {
		if (typeof x == 'undefined') {
			x = nodes.length ? nodes[nodes.length - 1].x : 0;
		}

		if (typeof y == 'undefined') {
			y = nodes.length ? nodes[nodes.length - 1].y : 0;
		}

		var node = new Node(x, y);

		presenter.createNode(node, nodes.length, grasp);

		if (nodes.length && !grasp) {
			updateEdge(nodes[nodes.length - 1], node);
			updateEdge(node, nodes[0]);
		}

		if (!grasp) {
			nodes.push(node);
		}

		return node;
	};

	this.moveNode = function(node, x, y) {
		node.x = x;
		node.y = y;
		presenter.updateNode(node);
		presenter.center(false);
		updateEdges(nodes.indexOf(node));
		self.updateGrasp();
	}

	this.removeNode = function(node) {
		var i = nodes.indexOf(node);
		var j = grasp.indexOf(node);

		if (j >= 0) {
			self.removeGrasp(node);
		}

		presenter.destroyNode(node);
		nodes.splice(i, 1);
		updateEdges(i - 1);
	}

	this.getMu = function() {
		return friction * 180 / Math.PI;
	}

	this.setMu = function(mu) {
		friction = mu * Math.PI / 180;
		self.updateGrasp();
	}

	this.init = function() {
		grasp = [];
		nodes = [];
		presenter.model = self;
		presenter.init();
		g0 = self.appendNode(0, 0, true);
		g1 = self.appendNode(0, 0, true);
		self.appendNode(-1, 1);
		self.appendNode(1, 1);
		self.appendNode(1, -1);
		self.appendNode(-1, -1);
		presenter.center(true);
	};
}
