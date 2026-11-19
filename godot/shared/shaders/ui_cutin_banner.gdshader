shader_type canvas_item;

uniform float slant : hint_range(-0.35, 0.35) = 0.14;
uniform float edge_softness : hint_range(0.005, 0.15) = 0.045;
uniform float top_bottom_fade : hint_range(0.0, 0.3) = 0.12;
uniform vec4 rim_tint : source_color = vec4(1.0, 0.95, 0.85, 0.65);
uniform float reveal : hint_range(0.0, 1.0) = 1.0;

void fragment() {
	vec4 tex = texture(TEXTURE, UV) * COLOR;
	float x_slant = UV.x + (UV.y - 0.5) * slant;
	float left_fade = smoothstep(0.02, 0.02 + edge_softness, x_slant);
	float right_fade = 1.0 - smoothstep(reveal - edge_softness, reveal, x_slant);
	float v_fade = smoothstep(0.0, top_bottom_fade, UV.y) * (1.0 - smoothstep(1.0 - top_bottom_fade, 1.0, UV.y));

	float border_line = smoothstep(0.02, 0.04, x_slant) * (1.0 - smoothstep(0.04, 0.07, x_slant));
	vec3 col = tex.rgb + rim_tint.rgb * border_line * rim_tint.a;
	float alpha = tex.a * left_fade * right_fade * v_fade;

	COLOR = vec4(col, alpha);
}
