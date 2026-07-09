const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// ================================================================
// 📖 40分钟剧本（240句 · 10秒/句）
// ================================================================
let scriptData = {
  currentIndex: 0,
  intervalSeconds: 10,
  lines: [
    // ===== 第1天 · 三人搬入（12句） =====
    { speaker: '裴金', text: '那个…大家好，我叫裴金…是做线上咨询的…' },
    { speaker: '墨迹淡', text: '……墨迹淡。' },
    { speaker: '和田兰', text: '我是和田兰，以后我来做饭。你们有什么忌口吗？' },
    { speaker: '裴金', text: '我…我没有忌口…都行…' },
    { speaker: '墨迹淡', text: '……随便。' },
    { speaker: '和田兰', text: '那我今晚做咖喱，你们觉得怎么样？' },
    { speaker: '裴金', text: '嗯…好。' },
    { speaker: '墨迹淡', text: '……（关门声）' },
    { speaker: '和田兰', text: '他不太爱说话，习惯就好。' },
    { speaker: '裴金', text: '我、我有点怕他…' },
    { speaker: '和田兰', text: '他其实不坏，只是需要时间。' },
    { speaker: '裴金', text: '嗯…' },

    // ===== 第2天 · 雨沫搬入（10句） =====
    { speaker: '雨沫', text: '（敲门声）请、请问这里是招合租吗…' },
    { speaker: '裴金', text: '啊！是的！请进！' },
    { speaker: '雨沫', text: '我、我是雨沫…' },
    { speaker: '裴金', text: '我叫裴金，和田兰姐在厨房…' },
    { speaker: '和田兰', text: '来了？房间在二楼左手边，我带你去。' },
    { speaker: '雨沫', text: '谢、谢谢…' },
    { speaker: '雨沫', text: '（把一把木剑悄悄靠在墙角）' },
    { speaker: '墨迹淡', text: '……（开门看了一眼，又关上）' },
    { speaker: '裴金', text: '她好小一只…' },
    { speaker: '和田兰', text: '但她眼里有东西。' },

    // ===== 第3天 · 赵思琪搬入（12句） =====
    { speaker: '赵思琪', text: '（推门进来）我来了！赵思琪！' },
    { speaker: '裴金', text: '你、你好…' },
    { speaker: '赵思琪', text: '你就是裴金？长得还行嘛！' },
    { speaker: '雨沫', text: '……（默默把剑挪到更角落）' },
    { speaker: '赵思琪', text: '你这头发是真的假的？太他妈白了吧！' },
    { speaker: '雨沫', text: '……真的。' },
    { speaker: '赵思琪', text: '我操，我也想染！' },
    { speaker: '和田兰', text: '思琪，先把行李放好。' },
    { speaker: '赵思琪', text: '行行行…' },
    { speaker: '赵思琪', text: '（凑近裴金）你身上好香啊，用啥洗衣液？' },
    { speaker: '裴金', text: '我…我不太清楚…' },
    { speaker: '赵思琪', text: '啧，算了，我自己找。' },

    // ===== 第4天 · 冲突（14句） =====
    { speaker: '赵思琪', text: '裴金姐你这胸也太小了吧哈哈哈！' },
    { speaker: '裴金', text: '……' },
    { speaker: '雨沫', text: '你真没礼貌。' },
    { speaker: '赵思琪', text: '我开个玩笑不行吗？' },
    { speaker: '雨沫', text: '不行。' },
    { speaker: '赵思琪', text: '你——' },
    { speaker: '和田兰', text: '思琪，来帮我切菜。' },
    { speaker: '赵思琪', text: '我不——行吧行吧。' },
    { speaker: '墨迹淡', text: '……（放下碗走了）' },
    { speaker: '裴金', text: '（眼眶红了）' },
    { speaker: '和田兰', text: '过来吃饭。' },
    { speaker: '裴金', text: '……嗯。' },
    { speaker: '雨沫', text: '（把一盒布丁放在裴金面前）' },
    { speaker: '裴金', text: '……谢谢。' },

    // ===== 第5天 · 第一次沉默（10句） =====
    { speaker: '裴金', text: '（深夜加班回来）' },
    { speaker: '和田兰', text: '饭在锅里，自己热。' },
    { speaker: '裴金', text: '你…怎么还没睡？' },
    { speaker: '和田兰', text: '怕你饿。' },
    { speaker: '裴金', text: '你对我太好了…' },
    { speaker: '和田兰', text: '你会一直住在这里吗？' },
    { speaker: '裴金', text: '……嗯。' },
    { speaker: '和田兰', text: '那就好。' },
    { speaker: '裴金', text: '（低头吃饭，没再说话）' },
    { speaker: '和田兰', text: '（看着她，很久没移开视线）' },

    // ===== 第6天 · 阳台对话（10句） =====
    { speaker: '墨迹淡', text: '（在阳台站着）' },
    { speaker: '墨羽', text: '（走过去，站旁边）' },
    { speaker: '墨迹淡', text: '……你也睡不着？' },
    { speaker: '墨羽', text: '嗯。' },
    { speaker: '墨迹淡', text: '这个家…你觉得能住多久？' },
    { speaker: '墨羽', text: '……不知道。' },
    { speaker: '墨迹淡', text: '我也是。' },
    { speaker: '墨羽', text: '但至少现在不坏。' },
    { speaker: '墨迹淡', text: '……嗯。' },
    { speaker: '墨羽', text: '……回去吧，风大了。' },

    // ===== 第7天 · 早餐（10句） =====
    { speaker: '赵思琪', text: '（睡眼惺忪下楼）好香…谁在做早饭？' },
    { speaker: '和田兰', text: '我。' },
    { speaker: '赵思琪', text: '你他妈也太好了吧…' },
    { speaker: '和田兰', text: '裴金，你吃点。' },
    { speaker: '裴金', text: '我……' },
    { speaker: '赵思琪', text: '你吃吧，不然她又得念叨。' },
    { speaker: '裴金', text: '（坐下，拿起筷子）' },
    { speaker: '雨沫', text: '（默默坐下，也开始吃）' },
    { speaker: '墨迹淡', text: '……（拿了一杯牛奶，站在窗边喝）' },
    { speaker: '赵思琪', text: '这他妈才是人过的日子。' },

    // ===== 第8天 · 练剑被发现（10句） =====
    { speaker: '雨沫', text: '（清晨在阳台练剑）' },
    { speaker: '墨迹淡', text: '（路过，停下来）……你在练什么？' },
    { speaker: '雨沫', text: '……剑。' },
    { speaker: '墨迹淡', text: '你练了多久？' },
    { speaker: '雨沫', text: '……很久了。' },
    { speaker: '墨迹淡', text: '……' },
    { speaker: '雨沫', text: '（收剑，低头）你别告诉别人。' },
    { speaker: '墨迹淡', text: '……不会。' },
    { speaker: '雨沫', text: '……谢谢。' },
    { speaker: '墨迹淡', text: '（转身走了）' },

    // ===== 第9天 · 思琪察觉（12句） =====
    { speaker: '赵思琪', text: '我发现和田兰好像特别在意裴金。' },
    { speaker: '雨沫', text: '……你看出来了。' },
    { speaker: '赵思琪', text: '什么意思？' },
    { speaker: '雨沫', text: '……没什么。' },
    { speaker: '赵思琪', text: '你别跟我说没什么，你肯定知道什么。' },
    { speaker: '雨沫', text: '……我什么都不知道。' },
    { speaker: '赵思琪', text: '啧，你们一个比一个能藏。' },
    { speaker: '雨沫', text: '……你最好也别问。' },
    { speaker: '赵思琪', text: '为什么？' },
    { speaker: '雨沫', text: '因为有些事…知道了反而不好。' },
    { speaker: '赵思琪', text: '……行吧。' },
    { speaker: '雨沫', text: '……（继续擦剑）' },

    // ===== 第10天 · 裴金夜归（10句） =====
    { speaker: '裴金', text: '（晚上10点回来，客厅灯亮着）' },
    { speaker: '和田兰', text: '你回来了。' },
    { speaker: '裴金', text: '你怎么还醒着？' },
    { speaker: '和田兰', text: '你还没回来，我睡不着。' },
    { speaker: '裴金', text: '你不用总是等我…' },
    { speaker: '和田兰', text: '我想等。' },
    { speaker: '裴金', text: '……' },
    { speaker: '和田兰', text: '你今天比昨天晚回十分钟。' },
    { speaker: '裴金', text: '（愣了一下）我…路上买了点东西。' },
    { speaker: '和田兰', text: '嗯。' },

    // ===== 第11天 · 思琪道歉（10句） =====
    { speaker: '赵思琪', text: '（走到裴金面前）喂。' },
    { speaker: '裴金', text: '嗯？' },
    { speaker: '赵思琪', text: '上次说你胸小…对不起。' },
    { speaker: '裴金', text: '……我没在意。' },
    { speaker: '赵思琪', text: '你肯定在意了。' },
    { speaker: '裴金', text: '……' },
    { speaker: '赵思琪', text: '我嘴就是欠，但我没坏心。' },
    { speaker: '裴金', text: '我知道。' },
    { speaker: '赵思琪', text: '你…你笑一下行不行？' },
    { speaker: '裴金', text: '（低头，嘴角动了动）' },

    // ===== 第12天 · 雨沫的过去（8句） =====
    { speaker: '雨沫', text: '（一个人坐在屋顶）' },
    { speaker: '墨迹淡', text: '（爬上去，坐在旁边）' },
    { speaker: '雨沫', text: '……你怎么上来的？' },
    { speaker: '墨迹淡', text: '梯子。' },
    { speaker: '雨沫', text: '……' },
    { speaker: '墨迹淡', text: '你在躲什么？' },
    { speaker: '雨沫', text: '……没有。' },
    { speaker: '墨迹淡', text: '（没再问，陪她坐着）' },

    // ===== 第13天 · 家宴（10句） =====
    { speaker: '和田兰', text: '今天晚上所有人都必须回来吃饭。' },
    { speaker: '赵思琪', text: '为什么？' },
    { speaker: '和田兰', text: '因为这是第一次全家人一起吃饭。' },
    { speaker: '赵思琪', text: '全家人…？' },
    { speaker: '和田兰', text: '嗯。全家人。' },
    { speaker: '裴金', text: '（低头）' },
    { speaker: '雨沫', text: '（坐直了身子）' },
    { speaker: '墨迹淡', text: '……（把椅子往前拉了一点）' },
    { speaker: '墨羽', text: '（看了一眼所有人，低下头）' },
    { speaker: '和田兰', text: '吃饭。' },

    // ===== 第14天 · 裴金失眠（8句） =====
    { speaker: '裴金', text: '（凌晨2点，还醒着）' },
    { speaker: '墨羽', text: '（从房间出来，看见她坐在客厅）' },
    { speaker: '墨羽', text: '……睡不着？' },
    { speaker: '裴金', text: '嗯。' },
    { speaker: '墨羽', text: '……' },
    { speaker: '裴金', text: '你说…人能一直待在一个地方吗？' },
    { speaker: '墨羽', text: '……能。' },
    { speaker: '裴金', text: '你怎么知道？' },
    { speaker: '墨羽', text: '我试过。' },

    // ===== 第15天 · 墨羽搬入（12句） =====
    { speaker: '墨羽', text: '（站门口，提着一个行李箱和一把旧吉他）' },
    { speaker: '裴金', text: '你是…墨羽？' },
    { speaker: '墨羽', text: '……嗯。' },
    { speaker: '赵思琪', text: '卧槽，又来了一个！' },
    { speaker: '和田兰', text: '房间在走廊尽头。' },
    { speaker: '墨羽', text: '……好。' },
    { speaker: '赵思琪', text: '你话好少啊，跟那个四眼仔一样。' },
    { speaker: '墨迹淡', text: '……' },
    { speaker: '赵思琪', text: '完了，两个沉默的，我要憋死了。' },
    { speaker: '雨沫', text: '……你可以跟我说话。' },
    { speaker: '赵思琪', text: '你他妈也不说啊！' },
    { speaker: '墨羽', text: '（关上房间门）' },

    // ===== 第16天 · 吉他声（10句） =====
    { speaker: '裴金', text: '（听到有人在弹吉他）' },
    { speaker: '赵思琪', text: '谁啊？大半夜的！' },
    { speaker: '雨沫', text: '……是墨羽。' },
    { speaker: '赵思琪', text: '弹得还挺好听…' },
    { speaker: '和田兰', text: '让他弹吧，吵不到我。' },
    { speaker: '裴金', text: '（靠在墙边，安静听着）' },
    { speaker: '墨迹淡', text: '……（门开了一条缝）' },
    { speaker: '赵思琪', text: '（安静下来）' },
    { speaker: '墨羽', text: '（弹完一首，停了）' },
    { speaker: '裴金', text: '……真好啊。' },

    // ===== 第17天 · 分工（10句） =====
    { speaker: '赵思琪', text: '我觉得我们得分工，不然太乱了。' },
    { speaker: '和田兰', text: '我做饭。' },
    { speaker: '雨沫', text: '我打扫。' },
    { speaker: '墨迹淡', text: '……倒垃圾。' },
    { speaker: '裴金', text: '我、我…' },
    { speaker: '赵思琪', text: '你负责被照顾。' },
    { speaker: '裴金', text: '……' },
    { speaker: '和田兰', text: '裴金负责收衣服和叠衣服。' },
    { speaker: '赵思琪', text: '那我呢？' },
    { speaker: '墨羽', text: '……你负责说话。' },

    // ===== 第18天 · 思琪的过去（10句） =====
    { speaker: '赵思琪', text: '（一个人坐在沙发上，没吃零食）' },
    { speaker: '雨沫', text: '……你怎么了？' },
    { speaker: '赵思琪', text: '没什么。' },
    { speaker: '雨沫', text: '你今天没吃东西。' },
    { speaker: '赵思琪', text: '不想吃。' },
    { speaker: '雨沫', text: '……' },
    { speaker: '赵思琪', text: '我打电话回家了。' },
    { speaker: '雨沫', text: '……' },
    { speaker: '赵思琪', text: '他们没接。' },
    { speaker: '雨沫', text: '（坐在她旁边）' },

    // ===== 第19天 · 裴金的改变（10句） =====
    { speaker: '裴金', text: '（主动做了早饭）' },
    { speaker: '赵思琪', text: '卧槽你居然会做饭？' },
    { speaker: '裴金', text: '……学了一点。' },
    { speaker: '和田兰', text: '（看着她，没说话）' },
    { speaker: '裴金', text: '我总不能一直靠兰姐…' },
    { speaker: '和田兰', text: '……' },
    { speaker: '赵思琪', text: '好家伙，太阳打西边出来了。' },
    { speaker: '雨沫', text: '（默默夹了一块）' },
    { speaker: '墨迹淡', text: '……还可以。' },
    { speaker: '裴金', text: '（低头笑了）' },

    // ===== 第20天 · 夜晚谈话（10句） =====
    { speaker: '和田兰', text: '你最近在躲我。' },
    { speaker: '裴金', text: '没有…' },
    { speaker: '和田兰', text: '你很少主动跟我说话了。' },
    { speaker: '裴金', text: '我只是…' },
    { speaker: '和田兰', text: '只是什么？' },
    { speaker: '裴金', text: '（沉默）' },
    { speaker: '和田兰', text: '你知道我不会害你。' },
    { speaker: '裴金', text: '……我知道。' },
    { speaker: '和田兰', text: '那就好。' },
    { speaker: '裴金', text: '……（还是没看她）' },

    // ===== 第21天 · 雨沫的秘密（8句） =====
    { speaker: '雨沫', text: '（深夜，一个人在客厅擦剑）' },
    { speaker: '赵思琪', text: '（下楼倒水，看到她）' },
    { speaker: '赵思琪', text: '……你到底是谁？' },
    { speaker: '雨沫', text: '……一个不该住在普通人家的人。' },
    { speaker: '赵思琪', text: '什么意思？' },
    { speaker: '雨沫', text: '（放下剑）你最好别知道。' },
    { speaker: '赵思琪', text: '……行吧。' },
    { speaker: '雨沫', text: '（把剑收进布套）' },

    // ===== 第22天 · 思琪帮雨沫（10句） =====
    { speaker: '赵思琪', text: '喂，你今天教我练剑吧。' },
    { speaker: '雨沫', text: '你不行。' },
    { speaker: '赵思琪', text: '你又说我不行！' },
    { speaker: '雨沫', text: '你站不稳三分钟。' },
    { speaker: '赵思琪', text: '我今天一定要站给你看！' },
    { speaker: '雨沫', text: '……' },
    { speaker: '赵思琪', text: '（真的站了，三分钟后开始抖）' },
    { speaker: '雨沫', text: '……还行。' },
    { speaker: '赵思琪', text: '你说还行？' },
    { speaker: '雨沫', text: '比昨天多了一分钟。' },

    // ===== 第23天 · 裴金崩溃（10句） =====
    { speaker: '裴金', text: '（把自己关在房间）' },
    { speaker: '和田兰', text: '（敲门）裴金？' },
    { speaker: '裴金', text: '……让我一个人待着。' },
    { speaker: '和田兰', text: '……' },
    { speaker: '墨羽', text: '（走到田兰身边）让她自己待会儿。' },
    { speaker: '和田兰', text: '……' },
    { speaker: '赵思琪', text: '（小声）她怎么了？' },
    { speaker: '墨迹淡', text: '……' },
    { speaker: '雨沫', text: '（在门口放了一杯水）' },
    { speaker: '裴金', text: '（过了很久才开门）……' },

    // ===== 第24天 · 墨羽的过去（10句） =====
    { speaker: '墨羽', text: '（坐在阳台，吉他在旁边）' },
    { speaker: '裴金', text: '（走过去，坐在旁边）' },
    { speaker: '墨羽', text: '……你也来躲？' },
    { speaker: '裴金', text: '嗯。' },
    { speaker: '墨羽', text: '……' },
    { speaker: '裴金', text: '你搬来这里之前…住在哪？' },
    { speaker: '墨羽', text: '……很多地方。' },
    { speaker: '裴金', text: '那现在呢？' },
    { speaker: '墨羽', text: '……这里。' },
    { speaker: '裴金', text: '（没再问）' },

    // ===== 第25天 · 田兰的让步（10句） =====
    { speaker: '和田兰', text: '（站在厨房，背对着所有人）' },
    { speaker: '裴金', text: '……兰姐。' },
    { speaker: '和田兰', text: '嗯。' },
    { speaker: '裴金', text: '我不躲你了。' },
    { speaker: '和田兰', text: '……' },
    { speaker: '裴金', text: '但你得让我…自己走几步。' },
    { speaker: '和田兰', text: '（沉默了很久）好。' },
    { speaker: '裴金', text: '……谢谢。' },
    { speaker: '和田兰', text: '（没有回头）' },

    // ===== 第26天 · 恢复日常（10句） =====
    { speaker: '赵思琪', text: '今天吃什么？' },
    { speaker: '和田兰', text: '你想吃什么？' },
    { speaker: '赵思琪', text: '我想吃火锅！' },
    { speaker: '雨沫', text: '太热了。' },
    { speaker: '赵思琪', text: '那你想吃啥？' },
    { speaker: '雨沫', text: '……什么都行。' },
    { speaker: '墨迹淡', text: '……面条。' },
    { speaker: '墨羽', text: '……可以。' },
    { speaker: '裴金', text: '我、我都可以…' },
    { speaker: '和田兰', text: '那就吃面条。' },

    // ===== 第27天 · 思琪的真心（8句） =====
    { speaker: '赵思琪', text: '喂，你们…会一直住在这里吧？' },
    { speaker: '雨沫', text: '……' },
    { speaker: '裴金', text: '我…会吧。' },
    { speaker: '墨迹淡', text: '……' },
    { speaker: '墨羽', text: '……嗯。' },
    { speaker: '赵思琪', text: '那就好。' },
    { speaker: '和田兰', text: '思琪。' },
    { speaker: '赵思琪', text: '干嘛？' },

    // ===== 第28天 · 吉他夜（10句） =====
    { speaker: '墨羽', text: '（又在弹吉他）' },
    { speaker: '赵思琪', text: '（坐在楼梯上听）' },
    { speaker: '裴金', text: '（靠在墙边听）' },
    { speaker: '雨沫', text: '（停下擦剑的手）' },
    { speaker: '墨迹淡', text: '（打开房间门）' },
    { speaker: '和田兰', text: '（放下手中的碗）' },
    { speaker: '墨羽', text: '（弹完一首，停了）' },
    { speaker: '赵思琪', text: '……再来一首吧。' },
    { speaker: '墨羽', text: '……好。' },
    { speaker: '（他又弹了一首，没人说话）' },

    // ===== 第29天 · 第30天 · 满月（20句） =====
    { speaker: '赵思琪', text: '一个月了！整整一个月了！' },
    { speaker: '裴金', text: '……这么快。' },
    { speaker: '和田兰', text: '一个月了。' },
    { speaker: '雨沫', text: '（把剑放回墙角）' },
    { speaker: '墨迹淡', text: '……' },
    { speaker: '墨羽', text: '……' },
    { speaker: '赵思琪', text: '我们是不是该庆祝一下？' },
    { speaker: '裴金', text: '庆祝？' },
    { speaker: '赵思琪', text: '对啊！满月！' },
    { speaker: '和田兰', text: '可以。' },
    { speaker: '赵思琪', text: '那我要吃蛋糕！' },
    { speaker: '雨沫', text: '……' },
    { speaker: '赵思琪', text: '你们不会连蛋糕都不让我吃吧？' },
    { speaker: '裴金', text: '我、我明天去买…' },
    { speaker: '赵思琪', text: '耶！' },
    { speaker: '和田兰', text: '（笑了）' },
    { speaker: '墨迹淡', text: '……（嘴角动了一下）' },
    { speaker: '墨羽', text: '……（低头，没说话）' },
    { speaker: '雨沫', text: '（把剑放好，坐了下来）' },
    { speaker: '裴金', text: '……下个月，我们还会在一起吧。' },
    { speaker: '和田兰', text: '……会。' }
  ]
};

let currentIndex = 0;
let intervalId = null;
let isPlaying = true;

const ADMIN_PASSWORD = 'admin123';

// ================================================================
// 📖 API
// ================================================================
app.get('/api/script', (req, res) => {
  const lines = scriptData.lines.slice(0, currentIndex + 1);
  res.json({
    currentIndex,
    total: scriptData.lines.length,
    interval: scriptData.intervalSeconds,
    isPlaying,
    lines
  });
});

app.post('/api/admin/interval', (req, res) => {
  const { password, seconds } = req.body;
  if (password !== ADMIN_PASSWORD) return res.json({ success: false, error: '密码错误' });
  scriptData.intervalSeconds = seconds;
  if (intervalId) clearInterval(intervalId);
  startTimer();
  res.json({ success: true });
});

app.post('/api/admin/update', (req, res) => {
  const { password, lines, index } = req.body;
  if (password !== ADMIN_PASSWORD) return res.json({ success: false, error: '密码错误' });
  if (lines) scriptData.lines = lines;
  if (index !== undefined) currentIndex = index;
  res.json({ success: true });
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.json({ success: false, error: '密码错误' });
  }
});

// ================================================================
// ⏱️ 自动推进
// ================================================================
function advanceScript() {
  if (!isPlaying) return;
  if (currentIndex < scriptData.lines.length - 1) {
    currentIndex++;
  } else {
    currentIndex = 0;
  }
}

function startTimer() {
  if (intervalId) clearInterval(intervalId);
  const seconds = scriptData.intervalSeconds || 10;
  intervalId = setInterval(advanceScript, seconds * 1000);
}

startTimer();

// ================================================================
// 🖥️ 前端页面
// ================================================================
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>🏠 公寓日记 · 直播</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:system-ui}
body{background:#1a1a27;color:#f0f0f0;padding:15px;display:flex;justify-content:center}
.wrap{max-width:650px;width:100%}
.top-bar{background:#292940;padding:12px 16px;border-radius:10px;margin-bottom:15px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px}
.scene{color:#ffd399;font-size:15px}
.right-group{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.clock{color:#aaccff;font-size:13px}
.live-badge{background:#ff4444;color:#fff;padding:2px 10px;border-radius:12px;font-size:12px;animation:blink 1s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
.menu-btn{background:none;border:none;color:#aaccff;font-size:24px;cursor:pointer;padding:0 6px}
.story-box{background:#1f1f32;border:1px solid #444466;border-radius:12px;padding:16px;height:620px;overflow-y:auto;line-height:1.7}
.line{margin:14px 0;padding-left:8px;border-left:3px solid #666}
.pei{border-left-color:#ffddaa;color:#ffe8c8}
.moji{border-left-color:#99ccff;color:#c8e0ff}
.hetian{border-left-color:#ffb8cc;color:#ffd8e6}
.yumo{border-left-color:#ff88aa;color:#ffb3b3}
.siqi{border-left-color:#ffaa66;color:#ffcc99}
.moyu{border-left-color:#aabbdd;color:#c8d8ee}
.action{font-size:12px;color:#999;margin-bottom:3px}
.empty-state{color:#666;text-align:center;padding:40px 0;}
.modal-overlay{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;align-items:center;justify-content:center}
.modal-overlay.open{display:flex}
.modal{background:#1f1f32;border:1px solid #444466;border-radius:16px;padding:20px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto}
.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.modal-header h2{color:#ffd399;font-size:18px}
.modal-close{background:none;border:none;color:#888;font-size:24px;cursor:pointer}
input,textarea{width:100%;padding:8px;margin:6px 0;border-radius:6px;border:1px solid #444;background:#1a1a27;color:#f0f0f0}
button{background:#5a4a8a;border:none;color:#fff;padding:8px 16px;border-radius:8px;cursor:pointer}
button:active{transform:scale(0.95)}
.progress-info{display:flex;gap:12px;font-size:12px;color:#888;padding:4px 0;flex-wrap:wrap}
.error-msg{color:#ff6666;background:#441111;padding:8px 12px;border-radius:8px;margin:8px 0}
</style>
</head>
<body>
<div class="wrap">
<div class="top-bar">
  <div style="display:flex;align-items:center;gap:10px;">
    <button class="menu-btn" onclick="toggleMenu()">☰</button>
    <span class="scene">🏠 公寓·客厅</span>
  </div>
  <div class="right-group">
    <span class="clock"><span class="live-badge">● 直播</span> <span id="count">0</span>句</span>
  </div>
</div>
<div id="progressDisplay" class="progress-info">⏳ 加载中...</div>
<div class="story-box" id="story"><div class="empty-state">⏳ 连接直播中...</div></div>
</div>

<!-- 菜单 -->
<div class="modal-overlay" id="menuModal">
  <div class="modal">
    <div class="modal-header">
      <h2>📋 菜单</h2>
      <button class="modal-close" onclick="closeMenu()">✕</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <button onclick="openAdmin()">🔐 创作者后台</button>
    </div>
  </div>
</div>

<!-- 后台 -->
<div class="modal-overlay" id="adminModal">
  <div class="modal">
    <div class="modal-header">
      <h2>🔐 创作者后台</h2>
      <button class="modal-close" onclick="closeAdmin()">✕</button>
    </div>
    <div id="adminContent"></div>
  </div>
</div>

<script>
(function() {
  let scriptLines = [];
  let currentIndex = 0;
  let totalLines = 0;
  let interval = 10;
  let isPlaying = true;
  let isAdmin = false;
  let loadError = false;

  async function fetchScript() {
    try {
      const res = await fetch('/api/script');
