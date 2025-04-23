class Cone {
    constructor() {
      this.type = 'cone';
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.matrix = new Matrix4();
      this.segments = 12;
    }

    render() {
        var rgba = this.color;
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    
        var angleStep = 360/this.segments;
        for(var angle = 0; angle < 360; angle += angleStep) {
          var angle1 = angle;
          var angle2 = angle + angleStep;
          var p1 = [Math.cos(angle1 * Math.PI/180), 0, Math.sin(angle1 * Math.PI/180)];
          var p2 = [Math.cos(angle2 * Math.PI/180), 0, Math.sin(angle2 * Math.PI/180)];
          var top = [0, 1, 0];
          
          drawTriangle3D([0,0,0, p1[0],0,p1[2], p2[0],0,p2[2]]);
          drawTriangle3D([p1[0],0,p1[2], top[0],top[1],top[2], p2[0],0,p2[2]]);
        }
      }
}