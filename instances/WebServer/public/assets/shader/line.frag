//varying vec3 vColor;
uniform float color;
		
void main()	{
	if(color == 0.0)
		gl_FragColor = vec4(1.,0.,0., 1.);
	if(color == 1.0)
		gl_FragColor = vec4(0.,1.,0., 1.);
	if(color == 2.0)
		gl_FragColor = vec4(0.,0.,1., 1.);
}