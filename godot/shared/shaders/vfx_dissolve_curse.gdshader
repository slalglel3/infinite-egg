shader_type canvas_item;

uniform sampler2D noise_tex : repeat_enable, filter_linear;
uniform vec4 dark_core : source_color = vec4(0.04, 0.02, 0.07, 1.0);
uniform vec4 burn_color : source_color = vec4(0.58, 0.16, 1.0, 1.0);
uniform float burn_hdr : hint_range(1.0, 8.0) = 3.0;
uniform float progress : hint_range(0.0, 1.0) = 0.25;
uniform float edge_width : hint_range(0.01, 0.3) = 0.10;
uniform vec2 flame_scroll = vec2(0.1, 1.4);
uniform float glitch_steps : hint_range(0.0, 64.0) = 24.0;
uniform float glitch_amount : hint_range(0.0, 0.15) = 0.03;

void fragment() {
	vec2 uv = UV;
	if (glitch_steps > 1.0 && glitch_amount > 0.0) {
		float band = floor(uv.y * glitch_steps);
		float jitter = texture(noise_tex, vec2(band * 0.17, TIME * 2.5)).r - 0.5;
		uv.x += step(0.32, abs(jitter)) * jitter * glitch_amount;
	}

	vec4 base = texture(TEXTURE, uv);
	float n = texture(noise_tex, uv * vec2(1.6, 1.0) + TIME * flame_scroll).r;
	float height_bias = mix(n, n * 0.7 + (1.0 - uv.y) * 0.45, 0.45);

	float alive = smoothstep(progress - 0.02, progress + 0.02, height_bias);
	float rim = smoothstep(progress - edge_width, progress, height_bias) * (1.0 - alive);

	vec3 col = mix(dark_core.rgb, base.rgb * COLOR.rgb, 0.35);
	col += burn_color.rgb * burn_hdr * rim;
	float alpha = base.a * COLOR.a * max(alive, rim);

	COLOR = vec4(col, alpha);
}
