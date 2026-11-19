shader_type canvas_item;

uniform sampler2D screen_texture : hint_screen_texture, filter_linear_mipmap;
uniform vec2 center_uv = vec2(0.5, 0.5);
uniform float progress : hint_range(0.0, 1.0) = 0.3;
uniform float force : hint_range(0.0, 0.15) = 0.045;
uniform float thickness : hint_range(0.01, 0.25) = 0.075;
uniform float aspect_ratio = 1.7777;
uniform vec4 ring_tint : source_color = vec4(1.0, 0.95, 0.85, 0.35);

void fragment() {
	vec2 dir = SCREEN_UV - center_uv;
	vec2 scaled_dir = vec2(dir.x * aspect_ratio, dir.y);
	float dist = length(scaled_dir);

	float radius = progress * 0.85;
	float inner = smoothstep(radius - thickness, radius, dist);
	float outer = 1.0 - smoothstep(radius, radius + thickness * 0.6, dist);
	float ring_mask = inner * outer * (1.0 - progress);

	vec2 offset = normalize(scaled_dir + vec2(0.0001)) * force * ring_mask;
	// Subtle chromatic split for heavy kinetic impact
	float r = texture(screen_texture, SCREEN_UV - offset * 1.15).r;
	float g = texture(screen_texture, SCREEN_UV - offset).g;
	float b = texture(screen_texture, SCREEN_UV - offset * 0.85).b;

	vec3 col = vec3(r, g, b) + ring_tint.rgb * ring_mask * ring_tint.a;
	COLOR = vec4(col, 1.0);
}
