import type { HandwritingScript } from "@/types/handwriting";

/**
 * Every diagram is 980x460. The canvas uses `diagramCrop` as its aspect ratio
 * and the overlay is scaled/offset so this exact region fills the canvas —
 * trim the horizontal whitespace here until the letter comfortably fills the box.
 */
export const CYRILLIC_HANDWRITING: HandwritingScript = {
  id: "cyrillic",
  name: "Cyrillic",
  diagramSize: { width: 980, height: 460 },
  diagramCrop: { x: 168, y: 0, width: 644, height: 460 },
  characters: [
    {
      key: "a",
      latin: "a",
      glyphs: { upper: "А", lower: "а" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_a_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_a_lower.png"),
      },
    },
    {
      key: "b",
      latin: "b",
      glyphs: { upper: "Б", lower: "б" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_b_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_b_lower.png"),
      },
    },
    {
      key: "v",
      latin: "v",
      glyphs: { upper: "В", lower: "в" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_v_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_v_lower.png"),
      },
    },
    {
      key: "g",
      latin: "g",
      glyphs: { upper: "Г", lower: "г" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_g_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_g_lower.png"),
      },
    },
    {
      key: "d",
      latin: "d",
      glyphs: { upper: "Д", lower: "д" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_d_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_d_lower.png"),
      },
    },
    {
      key: "ye",
      latin: "ye",
      glyphs: { upper: "Е", lower: "е" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_ye_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_ye_lower.png"),
      },
    },
    {
      key: "yo",
      latin: "yo",
      glyphs: { upper: "Ё", lower: "ё" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_yo_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_yo_lower.png"),
      },
    },
    {
      key: "zh",
      latin: "zh",
      glyphs: { upper: "Ж", lower: "ж" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_zh_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_zh_lower.png"),
      },
    },
    {
      key: "z",
      latin: "z",
      glyphs: { upper: "З", lower: "з" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_z_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_z_lower.png"),
      },
    },
    {
      key: "i",
      latin: "i",
      glyphs: { upper: "И", lower: "и" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_i_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_i_lower.png"),
      },
    },
    {
      key: "j",
      latin: "j",
      glyphs: { upper: "Й", lower: "й" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_j_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_j_lower.png"),
      },
    },
    {
      key: "k",
      latin: "k",
      glyphs: { upper: "К", lower: "к" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_k_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_k_lower.png"),
      },
    },
    {
      key: "l",
      latin: "l",
      glyphs: { upper: "Л", lower: "л" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_l_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_l_lower.png"),
      },
    },
    {
      key: "m",
      latin: "m",
      glyphs: { upper: "М", lower: "м" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_m_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_m_lower.png"),
      },
    },
    {
      key: "n",
      latin: "n",
      glyphs: { upper: "Н", lower: "н" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_n_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_n_lower.png"),
      },
    },
    {
      key: "o",
      latin: "o",
      glyphs: { upper: "О", lower: "о" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_o_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_o_lower.png"),
      },
    },
    {
      key: "p",
      latin: "p",
      glyphs: { upper: "П", lower: "п" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_p_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_p_lower.png"),
      },
    },
    {
      key: "r",
      latin: "r",
      glyphs: { upper: "Р", lower: "р" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_r_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_r_lower.png"),
      },
    },
    {
      key: "s",
      latin: "s",
      glyphs: { upper: "С", lower: "с" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_s_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_s_lower.png"),
      },
    },
    {
      key: "t",
      latin: "t",
      glyphs: { upper: "Т", lower: "т" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_t_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_t_lower.png"),
      },
    },
    {
      key: "u",
      latin: "u",
      glyphs: { upper: "У", lower: "у" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_u_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_u_lower.png"),
      },
    },
    {
      key: "f",
      latin: "f",
      glyphs: { upper: "Ф", lower: "ф" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_f_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_f_lower.png"),
      },
    },
    {
      key: "kh",
      latin: "kh",
      glyphs: { upper: "Х", lower: "х" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_kh_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_kh_lower.png"),
      },
    },
    {
      key: "ts",
      latin: "ts",
      glyphs: { upper: "Ц", lower: "ц" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_ts_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_ts_lower.png"),
      },
    },
    {
      key: "ch",
      latin: "ch",
      glyphs: { upper: "Ч", lower: "ч" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_ch_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_ch_lower.png"),
      },
    },
    {
      key: "sh",
      latin: "sh",
      glyphs: { upper: "Ш", lower: "ш" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_sh_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_sh_lower.png"),
      },
    },
    {
      key: "shch",
      latin: "shch",
      glyphs: { upper: "Щ", lower: "щ" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_shch_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_shch_lower.png"),
      },
    },
    {
      key: "hard_sign",
      latin: "ʺ",
      name: "hard sign",
      glyphs: { upper: "Ъ", lower: "ъ" },
      diagrams: {
        lower: require("../../assets/images/cyrillic/stroke_hard_sign_lower.png"),
      },
    },
    {
      key: "y",
      latin: "y",
      glyphs: { upper: "Ы", lower: "ы" },
      diagrams: {
        lower: require("../../assets/images/cyrillic/stroke_y_lower.png"),
      },
    },
    {
      key: "soft_sign",
      latin: "ʹ",
      name: "soft sign",
      glyphs: { upper: "Ь", lower: "ь" },
      diagrams: {
        lower: require("../../assets/images/cyrillic/stroke_soft_sign_lower.png"),
      },
    },
    {
      key: "e",
      latin: "e",
      glyphs: { upper: "Э", lower: "э" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_e_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_e_lower.png"),
      },
    },
    {
      key: "yu",
      latin: "yu",
      glyphs: { upper: "Ю", lower: "ю" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_yu_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_yu_lower.png"),
      },
    },
    {
      key: "ya",
      latin: "ya",
      glyphs: { upper: "Я", lower: "я" },
      diagrams: {
        upper: require("../../assets/images/cyrillic/stroke_ya_upper.png"),
        lower: require("../../assets/images/cyrillic/stroke_ya_lower.png"),
      },
    },
  ],
};