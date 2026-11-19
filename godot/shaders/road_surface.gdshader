shader_type canvas_item;

uniform vec4 depth_tint : source_color = vec4(1.0, 0.96, 0.88, 1.0);
uniform float tint_strength : hint_range(0.0, 1.0) = 0.0;
uniform float crack_flash : hint_range(0.0, 1.0) = 0.0;

void fragment() {
	vec4 tex = texture(TEXTURE, UV);
	vec3 col = mix(tex.rgb, tex.rgb * depth_tint.rgb, tint_strength);
	if (crack_flash > 0.001) {
		col = mix(col, vec3(0.95, 0.35, 0.12), crack_flash * 0.35);
	}
	COLOR = vec4(col, tex.a) * COLOR;
}
