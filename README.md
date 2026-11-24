# 人体肌群解剖版

这个 Skill 的主要作用是帮你**认识身体的每一块肌肉**。打开三维人体，点一下想了解的部位，选中的肌肉就会高亮。你可以读到它的中文名称、左右侧、所属肌群、位置和主要动作，再从另一个角度看看它与周围结构的关系。

当前版本有 **51 个目录条目**。模型可点选 218 个左右侧肌肉或分束区域，另外可分别点选两侧跟腱。头、手、足的一部分小结构作为定位参照合并显示。

![人体肌群解剖版实际渲染的正背面对照图](docs/anatomy-preview.png)

## 安装到你的 Agent

需要 Git、Python 3.8 或更新版本，以及支持 WebGL 2 的浏览器。网页和模型已经随 Skill 打包，安装后可以离线使用。

将仓库克隆到你的 Agent 的技能目录。下面以 `~/.agents/skills` 为例，如果你的 Agent 使用其他目录，请替换命令中的路径。

macOS 或 Linux 在终端运行：

```sh
mkdir -p ~/.agents/skills
git clone https://github.com/panggungunvibe/human-muscle-atlas.git ~/.agents/skills/human-muscle-atlas
```

Windows 在 PowerShell 运行：

```powershell
$skillsDir = Join-Path $env:USERPROFILE ".agents/skills"
New-Item -ItemType Directory -Force $skillsDir | Out-Null
git clone https://github.com/panggungunvibe/human-muscle-atlas.git (Join-Path $skillsDir "human-muscle-atlas")
```

安装后，在你的 Agent 中新建对话，输入下面这句即可打开图谱。

> 用「人体肌群解剖版」打开图谱，带我找到缝匠肌，看看它怎样斜跨大腿。

## 怎么用

1. **找位置。** 在目录中输入「缝匠肌」，或直接点击大腿前侧斜行的细长肌肉。详情中会显示名称、所属肌群和主要作用。
2. **看走向。** 拖动模型即可旋转，滚轮缩放，按住鼠标右键拖动可平移。手机上用单指旋转，双指缩放或平移。
3. **辨认相邻结构。** 切到「背面」，点击小腿后方的腓肠肌，再点击下方浅色的跟腱，对照肌腹与肌腱。想看清某一块肌肉时，选择「单独显示」或「放大观察」。

也可以直接启动网页。在仓库根目录运行：

```sh
python3 scripts/launch.py --open --muscle "腓肠肌"
```

Windows 将 `python3` 换成 `py -3`。去掉 `--muscle` 就会打开全身图谱。脚本会打印本机地址，按 Ctrl+C 可关闭服务。

## 资料来源

| 内容 | 来源与处理 |
| --- | --- |
| 三维解剖结构 | 使用 [Fit Mit With anatomy atlas](https://github.com/slfresh/fitmitwith-anatomy-atlas/tree/4120ee68b6604b8f2f69105d6de6166fad4734c4) 整理的移动端网格，源自 [Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy) 和日本生命科学数据库中心的 [BodyParts3D](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html)。本版分离了左右跟腱，局部展示腹直肌和颈部结构，并添加了纤维示意材质、眼部细节和中文选区。 |
| 中文名称与肌群分区 | 参考维基百科[《人体肌肉列表》](https://zh.wikipedia.org/wiki/人體肌肉列表)，按头颈、躯干、上肢和下肢整理目录。 |
| 肌肉位置与主要动作 | 参考 OpenStax《Anatomy and Physiology 2e》第 11 章的[头颈与背部](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-3-axial-muscles-of-the-head-neck-and-back)、[腹壁与胸廓](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-4-axial-muscles-of-the-abdominal-wall-and-thorax)、[肩带与上肢](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs)及[骨盆带与下肢](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs)，以中文概述。 |

## 源码与许可

- [SKILL.md](SKILL.md) 是技能入口，[启动脚本](scripts/launch.py) 提供本机预览，[viewer](viewer/) 包含可编辑的网页源码。
- Skill 指令、启动脚本和原创界面代码使用 [MIT License](LICENSE)。第三方库沿用各自许可。
- 三维模型、解剖模型改编及本页正背面渲染图适用 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)。转载或改编时，请保留[模型署名与改动记录](assets/atlas/models/credits.txt)，并按相同许可分享模型改编。

如果要修改网页，在 `viewer/` 内编辑源码后，回到仓库根目录运行下面两条命令重建网页。重建产物会写入 Skill 自带的 `assets/atlas/`。

```sh
npm --prefix viewer ci
npm --prefix viewer run build
```
