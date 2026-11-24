---
name: human-muscle-atlas
description: 打开「人体肌群解剖版」交互式三维图谱，用于查看某块肌肉在身体上的位置、辨认所属肌群与主要动作，或按用户指定的部位旋转、放大及对照学习。
---

# 人体肌群解剖版

用户要看图谱时，在本技能目录运行 `python3 scripts/launch.py`。若点名肌肉，将名称作为一个参数传给 `--muscle`，例如 `python3 scripts/launch.py --muscle "腓肠肌"`。Windows 可用 `py -3` 代替 `python3`。

在可保留的终端会话中启动服务，读取第一行输出的本机 URL，并在用户可访问的浏览器预览里打开它。没有预览面板时，返回该 URL；在用户本机也可以给脚本加 `--open` 打开默认浏览器。访问期间保持服务运行。端口由系统分配，使用脚本输出的地址。

讲解具体肌肉时，可用 `viewer/src/atlas-parts.js` 查肌肉或分束对应的目录项，再从 `viewer/src/muscle-data.js` 或 `viewer/src/extra-data.js` 读取位置、肌群、作用和体表定位。说明当前讲的是整块肌肉、某个分束还是一组肌肉。找不到独立选区时，指明模型中能看到的相邻结构。

图谱支持点击模型识别肌肉，拖动旋转，在「正面」「背面」「侧面」间切换，并用「单独显示」观察深层结构。模型的出处和具体改动见 [资料署名](assets/atlas/models/credits.txt)。
