const regions = {
  shoulder: ["upper", "肩部", "后外侧", "back"],
  arm: ["upper", "上臂", "前侧", "front"],
  forearm: ["upper", "前臂", "外侧", "side"],
  chest: ["torso", "胸部", "前侧", "front"],
  abdomen: ["torso", "腹壁", "前外侧", "front"],
  back: ["torso", "背部", "后侧", "back"],
  neck: ["head-neck", "颈部", "外侧", "side"],
  hip: ["lower", "髋部", "外侧", "side"],
  thigh: ["lower", "大腿", "前侧", "front"],
  calfFront: ["lower", "小腿", "前外侧", "front"],
  calfBack: ["lower", "小腿", "后侧", "back"]
};

// Region, geometry and action are group-level facts. The selected mesh supplies
// its own side and part name, including a specific head when present in the atlas.
const records = [
  ["sartorius","缝匠肌","Sartorius","M. sartorius","大腿前群","thigh","浅层","带状","从髂前上棘斜跨大腿前面，向内下方延伸到胫骨上端。","参与屈髋、外展和外旋大腿，也能屈膝。","可沿大腿前面的斜行长肌束，从髋外上方追踪到膝内侧。"],
  ["achilles","跟腱","Achilles tendon","Tendo calcaneus","小腿三头肌的共同肌腱","calfBack","浅层","肌腱","腓肠肌与比目鱼肌向下汇成粗厚的跟腱，附着于跟骨后面。","把小腿三头肌的拉力传到跟骨，帮助踮脚和蹬地。","在后视图寻找小腿肌腹下方通向脚跟的浅色肌腱。"],
  ["rotator-cuff","肩袖肌群","Rotator cuff","Musculi rotatores humeri","肩关节周围肌群","shoulder","深层","四肌组合","冈上肌、冈下肌、小圆肌和肩胛下肌围绕肩关节。","共同稳定肱骨头，各肌分别参与肩外展、外旋或内旋。","四块肌肉从肩胛骨的不同表面走向肱骨头附近。"],
  ["teres-major","大圆肌","Teres major","M. teres major","肩肌群","shoulder","浅层局部可见","长圆形","由肩胛骨下部走向肱骨近端。","伸肩、内收并内旋上臂。","在背侧沿腋后襞寻找背阔肌上方的肌束。"],
  ["pectoralis-minor","胸小肌","Pectoralis minor","M. pectoralis minor","胸前壁肌群","chest","深层","三角形","在胸大肌深面，从上部肋骨走向肩胛骨喙突。","将肩胛骨向前下方牵引并稳定肩带。","定位在胸大肌外上部深面。"],
  ["rhomboids","菱形肌群","Rhomboid muscles","Mm. rhomboidei","背部肩带肌群","back","深层","扁平","位于斜方肌深面，连接脊柱与肩胛骨内侧缘。","使肩胛骨后缩、下回旋并稳定于胸壁。","沿脊柱与肩胛骨内侧缘之间寻找，上方为小菱形肌。"],
  ["levator-scapulae","肩胛提肌","Levator scapulae","M. levator scapulae","背部肩带肌群","back","局部浅层","带状","由上位颈椎横突向下连接肩胛骨上角。","上提肩胛骨并协助肩胛骨下回旋。","沿肩胛骨上角向颈部追踪。"],
  ["serratus-posterior","后锯肌群","Posterior serratus muscles","Mm. serrati posteriores","背部胸壁肌群","back","深层","锯齿状","分别位于背上部及下胸段，肌齿附着于肋骨。","参与肋骨的运动与稳定。","辨认脊柱两侧呈薄片形、边缘分齿的肌肉。"],
  ["multifidus","腰多裂肌","Lumbar multifidus","M. multifidus lumborum","横突棘肌群","back","深层","短斜束","深居腰椎棘突两侧，由多个跨越数节椎骨的短肌束组成。","稳定椎骨之间的运动，协助躯干伸展与旋转。","位于腰背竖脊肌深面、靠近腰椎棘突。"],
  ["transversus-abdominis","腹横肌","Transversus abdominis","M. transversus abdominis","腹外侧壁肌群","abdomen","深层","横行阔肌","处于腹内斜肌深面，肌纤维大致环绕腹壁。","压缩腹腔，参与腹压调节和躯干稳定。","在腹外侧壁寻找最深的一层阔肌。"],
  ["internal-oblique","腹内斜肌","Internal oblique","M. obliquus internus abdominis","腹外侧壁肌群","abdomen","中间层","扁平阔肌","位于腹外斜肌与腹横肌之间，纤维向上内方展开。","参与躯干屈曲、侧屈、同侧旋转与腹部压缩。","在腹外斜肌的深面、髂嵴上方定位。"],
  ["quadratus-lumborum","腰方肌","Quadratus lumborum","M. quadratus lumborum","腹后壁肌群","back","深层","四边形","连接髂嵴、第十二肋和腰椎横突。","协助躯干侧屈，并稳定第十二肋。","在腰椎两侧、第十二肋与髂嵴之间定位。"],
  ["scalenes","斜角肌群","Scalene muscles","Mm. scaleni","颈外侧肌群","neck","深层","斜行肌束","前、中、后斜角肌从颈椎横突走向上位肋骨。","使颈部侧屈，并在用力吸气时协助上提肋骨。","在胸锁乳突肌深面，沿颈侧向第一、第二肋追踪。"],
  ["splenius","夹肌群","Splenius muscles","Mm. splenii","颈背肌群","neck","深层","宽带状","位于颈后部，分为头夹肌与颈夹肌。","双侧协同伸头颈，单侧收缩使头颈向同侧旋转。","在斜方肌上部深面沿颈后两旁定位。"],
  ["brachialis","肱肌","Brachialis","M. brachialis","上臂前群","arm","部分浅层","扁梭形","从肱骨前面延伸至尺骨，位于肱二头肌深面。","屈肘，使前臂向上臂靠近。","在肱二头肌下半部两侧及肘前定位。"],
  ["coracobrachialis","喙肱肌","Coracobrachialis","M. coracobrachialis","上臂前群","arm","深层","长梭形","连接肩胛骨喙突与肱骨内侧中段。","参与屈肩与上臂内收。","从肩前方喙突向上臂内侧追踪。"],
  ["brachioradialis","肱桡肌","Brachioradialis","M. brachioradialis","前臂桡侧肌群","forearm","浅层","长梭形","沿前臂拇指侧，从肱骨外侧髁上嵴走向桡骨远端。","尤其在前臂中立位时参与屈肘。","以拇指朝上屈肘，前臂近端外侧的肌腹即在此处。"],
  ["supinator","旋后肌","Supinator","M. supinator","前臂后群","forearm","深层","薄片状","包裹桡骨近端，位于肘外侧深面。","使前臂旋后。","从肘关节外侧，沿桡骨近端寻找。"],
  ["anconeus","肘肌","Anconeus","M. anconeus","肘后肌群","forearm","浅层","小三角形","位于肘关节后外侧，连接肱骨外上髁与尺骨近端。","协助伸肘，并稳定肘关节。","在鹰嘴与肱骨外上髁之间定位。"],
  ["gluteus-minimus","臀小肌","Gluteus minimus","M. gluteus minimus","臀肌群","hip","深层","扇形","位于臀中肌深面，连接髂骨外侧与股骨大转子。","参与髋外展、内旋和步态中的骨盆稳定。","在髋外侧、臀中肌深面定位。"],
  ["iliopsoas","髂腰肌群","Iliopsoas","M. iliopsoas","髋前肌群","hip","深层","长肌与扇形肌","髂肌与腰大肌在髋前会合，并止于股骨小转子。","主要使髋关节屈曲，抬起大腿。","在骨盆前内侧追踪这两块肌肉走向股骨近端。"],
  ["tensor-fasciae-latae","阔筋膜张肌","Tensor fasciae latae","M. tensor fasciae latae","髋外侧肌群","hip","浅层","短带状","位于髋外前方，向下与髂胫束相连。","张紧髂胫束并协助髋关节屈曲、外展与内旋。","沿大腿外侧髂胫束向上追踪，可见它在髋前外侧的肌腹。"],
  ["hip-rotators","髋短外旋肌群","Short external rotators","Rotatores laterales coxae","髋周深层肌群","hip","深层","短肌组合","包括梨状肌、闭孔肌、孖肌与股方肌等。","使大腿外旋，并稳定股骨头。","多数位于臀大肌深面，肌纤维从骨盆走向股骨近端。"],
  ["plantaris","跖肌","Plantaris","M. plantaris","小腿后群","calfBack","浅层后群","短肌腹长腱","小肌腹位于膝后外侧，细长肌腱向跟骨方向下降。","轻度协助屈膝与踝跖屈。","从小腿后上方寻找细长肌腱。"],
  ["tibialis-posterior","胫骨后肌","Tibialis posterior","M. tibialis posterior","小腿后群","calfBack","深层","羽状","沿小腿后面深层下行，肌腱经过内踝后方。","使足内翻、协助跖屈并支撑足弓。","追踪绕过内踝后方、进入足内侧的肌腱。"],
  ["fibularis-tertius","第三腓骨肌","Fibularis tertius","M. fibularis tertius","小腿前群","calfFront","浅层","细长","位于小腿前外侧，肌腱通向足背外侧。","协助足背屈与外翻。","在踝前外侧沿肌腱向第五跖骨方向追踪。"],
  ["toe-extensors","趾长伸肌群","Long toe extensors","Extensores digitorum pedis","小腿前群","calfFront","前群","长肌腹长腱","肌腹在小腿前方，肌腱经踝前方到足背和足趾。","伸展相应足趾，并协助踝背屈。","从足背的伸肌腱沿踝前方向上追踪。"],
  ["toe-flexors","趾长屈肌群","Long toe flexors","Flexores digitorum pedis","小腿后群","calfBack","深层","长肌腹长腱","从小腿后方深层向下，肌腱经内踝后方通向足底。","屈曲相应足趾，并协助足踝稳定。","在内踝后方沿肌腱向上寻找肌腹。"],
  ["popliteus","腘肌","Popliteus","M. popliteus","小腿后群","calfBack","深层","三角形","位于膝后深面，从股骨外侧髁斜行到胫骨后面。","协助膝关节从伸直位开始屈曲，并参与小腿内旋。","在膝后窝深面、腓肠肌上部前方定位。"]
];

export const EXTRA_MUSCLES = records.map(([id, name, english, latin, group, region, layer, form, position, action, landmark]) => {
  const [category, area, view, preferredView] = regions[region];
  return { id, name, english, latin, group, category, area, view, preferredView, layer, form, position, action, landmark,
    color: id === "achilles" ? "#c9bba2" : "#b55243" };
});
