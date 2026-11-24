// The stable keys come from the glTF node extras. Each row pairs one catalog entry
// with the exact structure names shown when the user clicks a region on the model.
const regions = {
  "deltoid": { deltoid_anterior: "三角肌前束（锁骨部）", deltoid_lateral: "三角肌中束（肩峰部）", deltoid_posterior: "三角肌后束（肩胛冈部）" },
  "rotator-cuff": { supraspinatus: "冈上肌", infraspinatus: "冈下肌", subscapularis: "肩胛下肌", teres_minor: "小圆肌" },
  "teres-major": { teres_major: "大圆肌" },
  "quadriceps": { rectus_femoris: "股直肌", vastus_lateralis: "股外侧肌", vastus_medialis: "股内侧肌", vastus_intermedius: "股中间肌" },
  "hamstrings": { biceps_femoris_long: "股二头肌长头", biceps_femoris_short: "股二头肌短头", semitendinosus: "半腱肌", semimembranosus: "半膜肌" },
  "sartorius": { sartorius: "缝匠肌" },
  "adductors": { adductor_magnus: "大收肌", adductor_longus: "长收肌", adductor_brevis: "短收肌", gracilis: "股薄肌", pectineus: "耻骨肌" },
  "pectoralis-major": { pectoralis_major_clavicular: "胸大肌锁骨部", pectoralis_major_sternocostal: "胸大肌胸肋部", pectoralis_major_abdominal: "胸大肌腹部" },
  "pectoralis-minor": { pectoralis_minor: "胸小肌" },
  "serratus-anterior": { serratus_anterior: "前锯肌" },
  "trapezius": { trapezius_upper: "斜方肌上束", trapezius_middle: "斜方肌中束", trapezius_lower: "斜方肌下束" },
  "latissimus-dorsi": { latissimus_dorsi: "背阔肌" },
  "rhomboids": { rhomboid_major: "大菱形肌", rhomboid_minor: "小菱形肌" },
  "levator-scapulae": { levator_scapulae: "肩胛提肌" },
  "serratus-posterior": { serratus_posterior_inferior: "下后锯肌", serratus_posterior_superior: "上后锯肌" },
  "erector-spinae": { iliocostalis_lumborum: "髂肋肌腰部", iliocostalis_thoracis: "髂肋肌胸部", longissimus_thoracis: "胸最长肌", spinalis_thoracis: "胸棘肌" },
  "multifidus": { multifidus_lumborum: "腰多裂肌" },
  "rectus-abdominis": { rectus_abdominis: "腹直肌" },
  "transversus-abdominis": { transversus_abdominis: "腹横肌" },
  "external-oblique": { external_oblique: "腹外斜肌" },
  "internal-oblique": { internal_oblique: "腹内斜肌" },
  "quadratus-lumborum": { quadratus_lumborum: "腰方肌" },
  "sternocleidomastoid": { sternocleidomastoid: "胸锁乳突肌" },
  "scalenes": { scalenus_medius: "中斜角肌", scalenus_anterior: "前斜角肌", scalenus_posterior: "后斜角肌" },
  "splenius": { splenius_capitis: "头夹肌", splenius_colli: "颈夹肌" },
  "biceps-brachii": { biceps_brachii_long: "肱二头肌长头", biceps_brachii_short: "肱二头肌短头" },
  "brachialis": { brachialis: "肱肌" },
  "coracobrachialis": { coracobrachialis: "喙肱肌" },
  "triceps-brachii": { triceps_long: "肱三头肌长头", triceps_lateral: "肱三头肌外侧头", triceps_medial: "肱三头肌内侧头" },
  "brachioradialis": { brachioradialis_muscle: "肱桡肌" },
  "forearm-flexors": {
    flexor_carpi_radialis: "桡侧腕屈肌", palmaris_longus_muscle: "掌长肌",
    humeral_head_of_flexor_carpi_ulnaris: "尺侧腕屈肌肱头", ulnar_head_of_flexor_carpi_ulnaris: "尺侧腕屈肌尺头",
    humero_ulnar_head_of_flexor_digitorum_superficialis: "指浅屈肌肱尺头", radial_head_of_flexor_digitorum_superficialis: "指浅屈肌桡头",
    flexor_digitorum_profundus: "指深屈肌", flexor_pollicis_longus: "拇长屈肌", pronator_quadratus: "旋前方肌",
    superficial_head_of_pronator_teres: "旋前圆肌浅头", deep_head_of_pronator_teres: "旋前圆肌深头"
  },
  "supinator": { supinator: "旋后肌" },
  "forearm-extensors": {
    extensor_digitorum: "指伸肌", ulnar_head_of_extensor_carpi_ulnaris: "尺侧腕伸肌尺头",
    humeral_head_of_extensor_carpi_ulnaris: "尺侧腕伸肌肱头", extensor_carpi_radialis_longus: "桡侧腕长伸肌",
    extensor_carpi_radialis_brevis: "桡侧腕短伸肌", extensor_digiti_minimi: "小指伸肌", abductor_pollicis_longus: "拇长展肌",
    extensor_indicis: "示指伸肌", extensor_pollicis_brevis: "拇短伸肌", extensor_pollicis_longus: "拇长伸肌"
  },
  "anconeus": { anconeus_muscle: "肘肌" },
  "gluteus-maximus": { gluteus_maximus: "臀大肌" },
  "gluteus-medius": { gluteus_medius: "臀中肌" },
  "gluteus-minimus": { gluteus_minimus: "臀小肌" },
  "iliopsoas": { iliacus: "髂肌", psoas_major: "腰大肌" },
  "tensor-fasciae-latae": { tensor_fasciae_latae: "阔筋膜张肌" },
  "hip-rotators": { piriformis: "梨状肌", quadratus_femoris: "股方肌", obturator_internus: "闭孔内肌", obturator_externus: "闭孔外肌", gemellus_inferior: "下孖肌", gemellus_superior: "上孖肌" },
  "gastrocnemius": { gastrocnemius_lateral: "腓肠肌外侧头", gastrocnemius_medial: "腓肠肌内侧头" },
  "soleus": { soleus: "比目鱼肌" },
  "plantaris": { plantaris: "跖肌" },
  "tibialis-anterior": { tibialis_anterior: "胫骨前肌" },
  "tibialis-posterior": { tibialis_posterior: "胫骨后肌" },
  "fibularis": { fibularis_longus: "腓骨长肌", fibularis_brevis: "腓骨短肌" },
  "fibularis-tertius": { fibularis_tertius: "第三腓骨肌" },
  "toe-extensors": { extensor_digitorum_longus: "趾长伸肌", extensor_hallucis_longus: "𧿹长伸肌（拇趾长伸肌）" },
  "toe-flexors": { flexor_digitorum_longus: "趾长屈肌", flexor_hallucis_longus: "𧿹长屈肌（拇趾长屈肌）" },
  "popliteus": { popliteus: "腘肌" },
  "achilles": { achilles_tendon: "跟腱" }
};

export const ATLAS_PARTS = new Map(
  Object.entries(regions).flatMap(([muscleId, parts]) =>
    Object.entries(parts).map(([key, partZh]) => [key, { muscleId, partZh }])
  )
);
