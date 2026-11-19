shader_type canvas_item;

uniform vec4 flash_color : source_color = vec4(1.0, 0.96, 0.90, 1.0);
uniform float flash_amount : hint_range(0.0, 1.0) = 0.0;
uniform float flash_hdr : hint_range(1.0, 4.0) = 1.8;

uniform vec4 outline_color : source_color = vec4(0.45, 0.85, 1.0, 1.0);
uniform float outline_width : hint_range(0.0, 6.0) = 0.0;
uniform float outline_hdr : hint_range(1.0, 5.0) = 1.8;

void fragment() {
	vec4 tex = texture(TEXTURE, UV) * COLOR;
	float max_neighbor_a = tex.a;

	if (outline_width > 0.01) {
		vec2 px = TEXTURE_PIXEL_SIZE * outline_width;
		max_neighbor_a = max(max_neighbor_a, texture(TEXTURE, UV + vec2(px.x, 0.0)).a);
		max_neighbor_a = max(max_neighbor_a, texture(TEXTURE, UV + vec2(-px.x, 0.0)).a);
		max_neighbor_a = max(max_neighbor_a, texture(TEXTURE, UV + vec2(0.0, px.y)).a);
		max_neighbor_a = max(max_neighbor_a, texture(TEXTURE, UV + vec2(0.0, -px.y)).a);
	}

	float outline_mask = clamp(max_neighbor_a - tex.a, 0.0, 1.0) * COLOR.a;
	vec3 flashed = mix(tex.rgb, flash_color.rgb * flash_hdr, flash_amount);
	vec3 final_rgb = mix(flashed, outline_color.rgb * outline_hdr, outline_mask * outline_color.a);
	float final_a = max(tex.a, outline_mask * outline_color.a);

	COLOR = vec4(final_rgb, final_a);
}
