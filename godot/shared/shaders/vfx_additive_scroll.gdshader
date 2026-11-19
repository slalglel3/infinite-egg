shader_type canvas_item;
render_mode blend_add, unshaded;

uniform sampler2D noise_tex : repeat_enable, filter_linear;
uniform vec4 core_color : source_color = vec4(1.0, 0.92, 0.65, 1.0);
uniform vec4 edge_color : source_color = vec4(1.0, 0.45, 0.10, 1.0);
uniform float hdr_intensity : hint_range(0.5, 8.0) = 2.6;
uniform vec2 scroll_speed = vec2(0.0, -1.2);
uniform float noise_scale : hint_range(0.2, 6.0) = 1.5;
uniform float distort_strength : hint_range(0.0, 0.35) = 0.08;
uniform float alpha_power : hint_range(0.3, 4.0) = 1.3;
uniform float dissolve_cutoff : hint_range(0.0, 1.0) = 0.0;
uniform float rotation_speed : hint_range(-8.0, 8.0) = 0.0;

vec2 rotate_uv(vec2 uv, float angle) {
	vec2 centered = uv - vec2(0.5);
	float c = cos(angle);
	float s = sin(angle);
	return vec2(centered.x * c - centered.y * s, centered.x * s + centered.y * c) + vec2(0.5);
}

void fragment() {
	vec2 base_uv = UV;
	if (abs(rotation_speed) > 0.001) {
		base_uv = rotate_uv(UV, TIME * rotation_speed);
	}
	vec2 n_uv = base_uv * noise_scale + TIME * scroll_speed;
	float n = texture(noise_tex, n_uv).r;
	vec2 distorted_uv = base_uv + vec2(n - 0.5) * distort_strength;

	vec4 tex = texture(TEXTURE, clamp(distorted_uv, vec2(0.0), vec2(1.0)));
	float mask = pow(clamp(tex.a * COLOR.a, 0.0, 1.0), alpha_power);

	float energy = smoothstep(dissolve_cutoff, clamp(dissolve_cutoff + 0.35, 0.01, 1.0), n * 0.65 + mask * 0.55);
	vec3 col = mix(edge_color.rgb, core_color.rgb, clamp(energy * mask * 1.25, 0.0, 1.0));
	float out_alpha = mask * energy;

	COLOR = vec4(col * hdr_intensity * out_alpha, out_alpha);
}
