import type { ScriptDiagramSet } from "@/types/handwriting";
/**
 * Stroke-order diagrams keyed by `Entry.key` (same ids as the audio files).
 * Labels, romanizations and glyphs all come from the lesson entries.
 *
 * Every diagram is 980x460. `diagramCrop` is the single source of truth for
 * alignment: it defines the canvas aspect ratio *and* the overlay transform —
 * trim the horizontal whitespace here until the letters fill the box.
 */
export const CYRILLIC_DIAGRAMS: ScriptDiagramSet = {
  scriptId: "cyrillic",
  diagramSize: { width: 980, height: 460 },
  diagramCrop: { x: 168, y: 0, width: 644, height: 460 },
  diagrams: {
    a: {
      upper: require("../../assets/images/cyrillic/stroke_a_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_a_lower.png"),
    },
    b: {
      upper: require("../../assets/images/cyrillic/stroke_b_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_b_lower.png"),
    },
    v: {
      upper: require("../../assets/images/cyrillic/stroke_v_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_v_lower.png"),
    },
    g: {
      upper: require("../../assets/images/cyrillic/stroke_g_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_g_lower.png"),
    },
    d: {
      upper: require("../../assets/images/cyrillic/stroke_d_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_d_lower.png"),
    },
    ye: {
      upper: require("../../assets/images/cyrillic/stroke_ye_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_ye_lower.png"),
    },
    yo: {
      upper: require("../../assets/images/cyrillic/stroke_yo_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_yo_lower.png"),
    },
    zh: {
      upper: require("../../assets/images/cyrillic/stroke_zh_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_zh_lower.png"),
    },
    z: {
      upper: require("../../assets/images/cyrillic/stroke_z_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_z_lower.png"),
    },
    i: {
      upper: require("../../assets/images/cyrillic/stroke_i_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_i_lower.png"),
    },
    j: {
      upper: require("../../assets/images/cyrillic/stroke_j_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_j_lower.png"),
    },
    k: {
      upper: require("../../assets/images/cyrillic/stroke_k_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_k_lower.png"),
    },
    l: {
      upper: require("../../assets/images/cyrillic/stroke_l_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_l_lower.png"),
    },
    m: {
      upper: require("../../assets/images/cyrillic/stroke_m_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_m_lower.png"),
    },
    n: {
      upper: require("../../assets/images/cyrillic/stroke_n_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_n_lower.png"),
    },
    o: {
      upper: require("../../assets/images/cyrillic/stroke_o_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_o_lower.png"),
    },
    p: {
      upper: require("../../assets/images/cyrillic/stroke_p_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_p_lower.png"),
    },
    r: {
      upper: require("../../assets/images/cyrillic/stroke_r_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_r_lower.png"),
    },
    s: {
      upper: require("../../assets/images/cyrillic/stroke_s_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_s_lower.png"),
    },
    t: {
      upper: require("../../assets/images/cyrillic/stroke_t_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_t_lower.png"),
    },
    u: {
      upper: require("../../assets/images/cyrillic/stroke_u_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_u_lower.png"),
    },
    f: {
      upper: require("../../assets/images/cyrillic/stroke_f_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_f_lower.png"),
    },
    kh: {
      upper: require("../../assets/images/cyrillic/stroke_kh_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_kh_lower.png"),
    },
    ts: {
      upper: require("../../assets/images/cyrillic/stroke_ts_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_ts_lower.png"),
    },
    ch: {
      upper: require("../../assets/images/cyrillic/stroke_ch_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_ch_lower.png"),
    },
    sh: {
      upper: require("../../assets/images/cyrillic/stroke_sh_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_sh_lower.png"),
    },
    shch: {
      upper: require("../../assets/images/cyrillic/stroke_shch_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_shch_lower.png"),
    },
    hard_sign: {
      lower: require("../../assets/images/cyrillic/stroke_hard_sign_lower.png"),
    },
    y: {
      lower: require("../../assets/images/cyrillic/stroke_y_lower.png"),
    },
    soft_sign: {
      lower: require("../../assets/images/cyrillic/stroke_soft_sign_lower.png"),
    },
    e: {
      upper: require("../../assets/images/cyrillic/stroke_e_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_e_lower.png"),
    },
    yu: {
      upper: require("../../assets/images/cyrillic/stroke_yu_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_yu_lower.png"),
    },
    ya: {
      upper: require("../../assets/images/cyrillic/stroke_ya_upper.png"),
      lower: require("../../assets/images/cyrillic/stroke_ya_lower.png"),
    },
  },
};