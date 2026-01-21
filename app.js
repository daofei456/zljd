// 强制执行官 - 主应用逻辑

class StudyApp {
    constructor() {
        this.timer = null;
        this.remainingTime = 25 * 60; // 默认25分钟
        this.selectedTime = 25;
        this.isRunning = false;
        this.startTime = null;
        this.currentSubject = null;
        this.wakeLock = null; // 屏幕常亮对象
        this.audio = null; // 白噪音音频对象
        this.currentSound = 'none'; // 当前选择的音效
        this.audioEnabled = false; // 音频是否启用
        
        // 统计数据
        this.stats = {
            todayTime: 0,
            escapeCount: 0,
            completeCount: 0
        };
        
        // 加载统计数据
        this.loadStats();
        
        // 音效配置
        this.sounds = {
            none: null,
            rain: 'rain',
            library: 'library',
            cafe: 'cafe'
        };
        
        // Web Audio API 上下文
        this.audioContext = null;
        this.gainNode = null;
        this.noiseSource = null;
        this.noiseType = null;
        
        // 初始化音频
        this.initAudio();
        
        // 毒舌语录库
        this.quotes = {
            start: [
                "别看了，再看你也考不上，赶紧滚去刷题。",
                "现在开始学习，比明天开始早了整整24小时。",
                "你的对手已经在做题了，你还在磨叽什么？",
                "想想你想去的学校，想想你想过的生活，现在动起来！",
                "今天的汗水，是明天的骄傲。别让未来的自己后悔！",
                "考研/考公不等人，时间宝贵，立刻开始！",
                "你以为还有很多时间？其实每天都在减少！",
                "别给自己找借口，开始就是了！",
                "现在的每一分钟，都决定着你的未来。",
                "放弃很容易，但坚持很酷！"
            ],
            escape: [
                "呵，就这？考场上的空调吹着肯定比自习室舒服吧？",
                "逃跑次数+1，你离上岸又远了一步。",
                "连25分钟都坚持不了，还想上岸？",
                "记住这个感觉，这是你失败的原因。",
                "每次逃跑，都是在和自己的未来开玩笑。",
                "你以为你在休息？其实你在逃避！",
                "连这点自律都没有，凭什么考上？",
                "下次再跑，直接取消考试资格！",
                "记住：只有坚持的人才能上岸。",
                "逃跑是本能，坚持是本事。你选哪个？"
            ],
            complete: [
                "不错，离上岸近了0.01厘米，继续保持。",
                "今天的你，比昨天的你更接近目标。",
                "每一分钟的坚持，都在为梦想加码。",
                "你做到了！这只是开始，继续加油！",
                "看吧，其实你比想象中更强大。",
                "今天的努力，明天会给你答案。",
                "完成了！离目标又近了一步。",
                "坚持就是胜利，你证明了自己！",
                "做得好！继续保持这个节奏！",
                "每个完成的番茄钟，都是通往成功的阶梯。"
            ]
        };
        
        this.init();
    }
    
    // 初始化音频
    initAudio() {
        console.log('初始化音频系统...');
        console.log('浏览器信息:', navigator.userAgent);
        console.log('是否支持AudioContext:', !!window.AudioContext);
        console.log('是否支持webkitAudioContext:', !!window.webkitAudioContext);
        
        // 检查是否支持 Web Audio API
        if (!window.AudioContext && !window.webkitAudioContext) {
            console.error('浏览器不支持 Web Audio API');
            alert('您的浏览器不支持音频功能');
            this.audioEnabled = false;
            return;
        }
        
        try {
            // 创建音频上下文
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            console.log('使用 AudioContext:', AudioContext.name);
            
            this.audioContext = new AudioContext();
            console.log('Web Audio API 初始化成功');
            console.log('音频状态:', this.audioContext.state);
            console.log('采样率:', this.audioContext.sampleRate);
            this.audioEnabled = true;
            
            // 监听状态变化
            this.audioContext.onstatechange = () => {
                console.log('音频状态变化:', this.audioContext.state);
            };
        } catch (err) {
            console.error('音频初始化失败:', err);
            console.error('错误名称:', err.name);
            console.error('错误信息:', err.message);
            alert('音频初始化失败: ' + err.message);
            this.audioEnabled = false;
        }
    }
    
    init() {
        this.bindEvents();
        this.updateDisplay();
        this.checkVisibility();
    }
    
    bindEvents() {
        // 时间选择按钮
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.isRunning) return;
                
                document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedTime = parseInt(e.target.dataset.time);
                this.remainingTime = this.selectedTime * 60;
                this.updateDisplay();
            });
        });
        
        // 测试音效按钮（调试用）
        document.addEventListener('keydown', (e) => {
            if (e.key === 't' || e.key === 'T') {
                console.log('===== 音频测试开始 =====');
                console.log('当前选择音效:', this.currentSound);
                console.log('音频对象:', this.audio);
                console.log('浏览器信息:', navigator.userAgent);
                console.log('是否支持WakeLock:', 'wakeLock' in navigator);
                
                // 尝试播放测试音
                const testAudio = new Audio();
                testAudio.src = this.sounds['rain'];
                console.log('测试音频URL:', testAudio.src);
                
                const testPlay = testAudio.play();
                if (testPlay !== undefined) {
                    testPlay.then(() => {
                        console.log('测试音频播放成功！');
                        setTimeout(() => {
                            testAudio.pause();
                            console.log('测试音频已停止');
                        }, 2000);
                    }).catch(err => {
                        console.error('测试音频播放失败:', err);
                    });
                }
                console.log('===== 音频测试结束 =====');
            }
        });
        
        // 开始按钮
        document.getElementById('startBtn').addEventListener('click', () => {
            this.showSubjectModal();
        });
        
        // 停止按钮
        document.getElementById('stopBtn').addEventListener('click', () => {
            this.stopStudy();
        });
        
        // 弹窗关闭按钮
        document.getElementById('dialogClose').addEventListener('click', () => {
            document.getElementById('devilDialog').classList.add('hidden');
        });
        
        // 音效选择
        document.querySelectorAll('.sound-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentSound = e.target.dataset.sound;
                console.log('用户选择音效:', this.currentSound);
                this.updateSound();
            });
        });
        
        // 科目选择
        document.querySelectorAll('.subject-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentSubject = e.target.dataset.subject;
                document.getElementById('subjectModal').classList.add('hidden');
                this.startStudy();
            });
        });
        
        // 海报相关
        document.getElementById('downloadPoster').addEventListener('click', () => {
            this.downloadPoster();
        });
        
        document.getElementById('closePoster').addEventListener('click', () => {
            document.getElementById('posterModal').classList.add('hidden');
        });
        
        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        
        // 页面即将卸载
        window.addEventListener('beforeunload', (e) => {
            if (this.isRunning) {
                e.preventDefault();
                e.returnValue = '学习正在进行中，确定要离开吗？';
                return e.returnValue;
            }
        });
        
        // 日历相关事件
        document.getElementById('showCalendar').addEventListener('click', () => {
            this.showCalendar();
        });
        
        document.getElementById('closeCalendar').addEventListener('click', () => {
            document.getElementById('calendarModal').classList.add('hidden');
        });
        
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.changeMonth(-1);
        });
        
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.changeMonth(1);
        });
    }
    
    // 日历相关方法
    showCalendar() {
        document.getElementById('calendarModal').classList.remove('hidden');
        this.currentCalendarDate = new Date();
        this.renderCalendar();
        this.checkEmptyDays();
    }
    
    renderCalendar() {
        const year = this.currentCalendarDate.getFullYear();
        const month = this.currentCalendarDate.getMonth();
        
        // 更新月份标题
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', 
                           '7月', '8月', '9月', '10月', '11月', '12月'];
        document.getElementById('currentMonth').textContent = `${year}年${monthNames[month]}`;
        
        // 获取当月第一天和最后一天
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // 获取当月第一天是星期几（0=周日）
        const firstDayWeek = firstDay.getDay();
        
        // 清空日历
        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';
        
        // 添加空白天数
        for (let i = 0; i < firstDayWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarDays.appendChild(emptyDay);
        }
        
        // 添加当月天数
        const today = new Date();
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            // 检查是否是今天
            if (year === today.getFullYear() && 
                month === today.getMonth() && 
                day === today.getDate()) {
                dayElement.classList.add('today');
            }
            
            // 获取当天的学习数据
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayData = this.getDayData(dateStr);
            
            // 根据学习时长设置颜色
            if (dayData && dayData.totalTime > 0) {
                let level = 0;
                if (dayData.totalTime < 30) level = 1;
                else if (dayData.totalTime < 60) level = 2;
                else if (dayData.totalTime < 90) level = 3;
                else level = 4;
                
                dayElement.classList.add(`level-${level}`);
                
                // 添加点击事件显示详情
                dayElement.addEventListener('click', () => {
                    this.showDayDetail(dayData, dateStr);
                });
            } else {
                dayElement.classList.add('level-0');
            }
            
            calendarDays.appendChild(dayElement);
        }
    }
    
    changeMonth(direction) {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + direction);
        this.renderCalendar();
        this.checkEmptyDays();
    }
    
    // 检查空日期并触发毒舌提醒
    checkEmptyDays() {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const day = today.getDate();
        
        // 检查过去7天是否有未学习的天数
        let emptyDays = 0;
        for (let i = 1; i <= 7; i++) {
            const checkDate = new Date(year, month, day - i);
            if (checkDate >= new Date(2024, 0, 1)) { // 从2024年开始计算
                const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
                const dayData = this.getDayData(dateStr);
                if (!dayData || dayData.totalTime === 0) {
                    emptyDays++;
                }
            }
        }
        
        // 如果有超过3天空着，显示毒舌提醒
        if (emptyDays >= 3) {
            const quotes = [
                `过去7天你有${emptyDays}天没学习，是在等考试延期吗？`,
                `空着的日历就像你空着的脑子，赶紧填满！`,
                `连续${emptyDays}天不学习，你是想放弃了吗？`,
                `看看这空白的日历，再看看你空白的未来`,
                `打卡断更${emptyDays}天，你离上岸越来越远了`
            ];
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            
            // 延迟显示提醒，避免与开始弹窗冲突
            setTimeout(() => {
                document.getElementById('dialogText').textContent = randomQuote;
                document.getElementById('dialogAvatar').textContent = '👿';
                document.querySelector('.dialog-box').className = 'dialog-box escape';
                document.getElementById('devilDialog').classList.remove('hidden');
            }, 2000);
        }
    }
    
    // 获取某天的学习数据
    getDayData(dateStr) {
        const allData = JSON.parse(localStorage.getItem('studyCalendar') || '{}');
        return allData[dateStr];
    }
    
    // 保存某天的学习数据
    saveDayData(dateStr, data) {
        const allData = JSON.parse(localStorage.getItem('studyCalendar') || '{}');
        
        // 如果已有数据，累加
        if (allData[dateStr]) {
            allData[dateStr].totalTime += data.totalTime || 0;
            allData[dateStr].escapeCount += data.escapeCount || 0;
            allData[dateStr].completeCount += data.completeCount || 0;
            // 保存最后一次的科目
            if (data.subject) {
                allData[dateStr].subject = data.subject;
            }
        } else {
            allData[dateStr] = data;
        }
        
        localStorage.setItem('studyCalendar', JSON.stringify(allData));
    }
    
    // 显示某天详情
    showDayDetail(dayData, dateStr) {
        const [year, month, day] = dateStr.split('-');
        const date = new Date(year, month - 1, day);
        const dateText = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        
        let detail = `${dateText} 学习详情：\n\n`;
        detail += `📚 学习时长：${dayData.totalTime}分钟\n`;
        detail += `✅ 完成番茄：${dayData.completeCount}个\n`;
        detail += `😱 逃跑次数：${dayData.escapeCount}次\n`;
        if (dayData.subject) {
            detail += `📝 学习科目：${dayData.subject}\n`;
        }
        
        alert(detail);
    }
    
    showSubjectModal() {
        document.getElementById('subjectModal').classList.remove('hidden');
    }
    
    startStudy() {
        this.isRunning = true;
        this.startTime = Date.now();
        
        console.log('=== 开始学习流程开始 ===');
        console.log('音频系统状态:', this.audioEnabled ? '已启用' : '未启用');
        console.log('当前选择音效:', this.currentSound);
        
        // 隐藏地址栏（全屏效果）
        if (window.scrollTo) {
            setTimeout(() => {
                window.scrollTo(0, 1);
            }, 100);
        }
        
        // 请求屏幕常亮（防止锁屏）
        this.requestWakeLock();
        
        // 恢复音频上下文（必须用户交互后调用）
        if (this.audioContext) {
            console.log('音频上下文状态:', this.audioContext.state);
            if (this.audioContext.state === 'suspended') {
                console.log('音频上下文被暂停，尝试恢复...');
                this.audioContext.resume().then(() => {
                    console.log('音频上下文恢复成功');
                    // 播放白噪音
                    setTimeout(() => {
                        this.playSound();
                    }, 100);
                }).catch(err => {
                    console.error('音频上下文恢复失败:', err);
                });
            } else {
                console.log('音频上下文已激活，直接播放');
                // 播放白噪音
                setTimeout(() => {
                    this.playSound();
                }, 100);
            }
        } else {
            console.log('音频上下文未初始化，尝试重新初始化');
            this.initAudio();
            if (this.audioContext) {
                setTimeout(() => {
                    this.playSound();
                }, 100);
            }
        }
        
        // 显示开始语录
        this.showDialog('start');
        
        // 更新按钮状态
        document.getElementById('startBtn').classList.add('hidden');
        document.getElementById('stopBtn').classList.remove('hidden');
        
        // 开始计时
        this.timer = setInterval(() => {
            this.remainingTime--;
            this.updateDisplay();
            
            if (this.remainingTime <= 0) {
                this.completeStudy();
            }
        }, 1000);
        
        console.log('=== 开始学习流程结束 ===');
    }
    
    stopStudy() {
        if (!this.isRunning) return;
        
        clearInterval(this.timer);
        this.isRunning = false;
        
        // 释放屏幕常亮
        this.releaseWakeLock();
        
        // 停止白噪音
        this.stopSound();
        
        // 计算实际学习时间（分钟）
        const actualMinutes = Math.round((Date.now() - this.startTime) / 1000 / 60);
        this.stats.todayTime += actualMinutes;
        this.stats.escapeCount++;
        
        // 保存逃跑数据到日历
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        this.saveDayData(dateStr, {
            totalTime: actualMinutes,
            escapeCount: 1,
            completeCount: 0,
            subject: this.currentSubject
        });
        
        // 显示逃跑语录
        this.showDialog('escape');
        
        // 更新显示
        this.updateStats();
        this.saveStats();
        
        // 重置状态
        this.resetState();
    }
    
    completeStudy() {
        clearInterval(this.timer);
        this.isRunning = false;
        
        // 释放屏幕常亮
        this.releaseWakeLock();
        
        // 停止白噪音
        this.stopSound();
        
        // 保存当天的学习数据到日历
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        this.saveDayData(dateStr, {
            totalTime: this.selectedTime,
            escapeCount: 0,
            completeCount: 1,
            subject: this.currentSubject
        });
        
        // 更新统计数据
        this.stats.todayTime += this.selectedTime;
        this.stats.completeCount++;
        
        // 显示完成语录
        this.showDialog('complete');
        
        // 更新显示
        this.updateStats();
        this.saveStats();
        
        // 生成海报
        setTimeout(() => {
            this.generatePoster();
        }, 1500);
        
        // 重置状态
        this.resetState();
    }
    
    resetState() {
        document.getElementById('startBtn').classList.remove('hidden');
        document.getElementById('stopBtn').classList.add('hidden');
        this.remainingTime = this.selectedTime * 60;
        this.updateDisplay();
    }
    
    // 播放白噪音（使用 Web Audio API 动态生成）
    playSound() {
        if (this.currentSound === 'none') {
            console.log('当前选择静音，不播放音频');
            return;
        }
        
        try {
            // 创建音频上下文（首次调用时）
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // 如果上下文被暂停，恢复它
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            this.noiseType = this.currentSound;
            this.generateAndPlayNoise();
            
            console.log('Web Audio API 白噪音已开始播放:', this.currentSound);
        } catch (err) {
            console.error('Web Audio API 初始化失败:', err);
            this.showAudioError();
        }
    }
    
    // 生成并播放白噪音
    generateAndPlayNoise() {
        console.log('生成并播放白噪音:', this.noiseType);
        
        try {
            if (!this.audioContext) {
                throw new Error('音频上下文未初始化');
            }
            
            const sampleRate = this.audioContext.sampleRate;
            console.log('采样率:', sampleRate);
            
            // 使用较小的缓冲区，减少内存占用
            const bufferSize = Math.min(2 * sampleRate, this.audioContext.destination.maxChannelCount || 2);
            console.log('缓冲区大小:', bufferSize);
            
            const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            console.log('开始生成噪音数据...');
            
            // 根据类型生成不同的噪音
            switch (this.noiseType) {
                case 'rain':
                    // 雨声 - 粉噪音（更柔和）
                    for (let i = 0; i < bufferSize; i++) {
                        output[i] = (Math.random() * 2 - 1) / (1 + i / bufferSize);
                    }
                    break;
                case 'library':
                    // 图书馆 - 棕噪音（更深沉）
                    let lastOut = 0;
                    for (let i = 0; i < bufferSize; i++) {
                        const white = Math.random() * 2 - 1;
                        output[i] = (lastOut + (0.1 * white)) / 1.1;
                        lastOut = output[i];
                    }
                    break;
                case 'cafe':
                    // 咖啡馆 - 白噪音
                    for (let i = 0; i < bufferSize; i++) {
                        output[i] = (Math.random() * 2 - 1) * 0.3;
                    }
                    break;
                default:
                    // 默认白噪音
                    for (let i = 0; i < bufferSize; i++) {
                        output[i] = Math.random() * 2 - 1;
                    }
            }
            
            console.log('噪音数据生成完成');
            
            // 创建增益节点控制音量
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime); // 音量 10%
            console.log('增益节点创建成功，音量设置为 10%');
            
            // 创建噪声源
            this.noiseSource = this.audioContext.createBufferSource();
            this.noiseSource.buffer = noiseBuffer;
            this.noiseSource.loop = true;
            
            console.log('噪声源创建成功');
            
            // 连接节点
            this.noiseSource.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
            
            console.log('音频节点连接成功');
            
            // 开始播放
            this.noiseSource.start(0);
            
            console.log('白噪音播放成功！');
            
        } catch (err) {
            console.error('生成或播放白噪音失败:', err);
            console.error('错误名称:', err.name);
            console.error('错误信息:', err.message);
            throw err;
        }
    }
    
    // 停止白噪音
    stopSound() {
        if (this.noiseSource) {
            console.log('停止 Web Audio API 白噪音');
            try {
                this.noiseSource.stop();
                this.noiseSource.disconnect();
                this.gainNode.disconnect();
            } catch (e) {
                console.log('停止音频时发生错误（可能已停止）:', e);
            }
            this.noiseSource = null;
            this.gainNode = null;
        }
    }
    
    // 更新音效（切换音效时使用）
    updateSound() {
        if (this.isRunning) {
            this.stopSound();
            setTimeout(() => {
                this.playSound();
            }, 100);
        }
    }
    
    // 显示音频错误提示
    showAudioError() {
        console.log('显示音频错误提示');
        alert('音频播放失败，请检查：\n1. 手机是否静音\n2. 浏览器是否允许音频播放\n3. 刷新页面重试');
    }
    
    // 更新音效
    updateSound() {
        // 如果正在学习，切换音效
        if (this.isRunning && this.audio) {
            this.stopSound();
            this.playSound();
        }
    }
    
    // 请求屏幕常亮（防止锁屏）
    async requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log('屏幕常亮已开启');
                
                // 监听页面可见性变化，重新请求WakeLock
                this.wakeLock.addEventListener('release', () => {
                    console.log('屏幕常亮已释放');
                });
            } catch (err) {
                console.error('无法开启屏幕常亮:', err);
            }
        } else {
            console.log('浏览器不支持屏幕常亮功能');
        }
    }
    
    // 释放屏幕常亮
    releaseWakeLock() {
        if (this.wakeLock) {
            this.wakeLock.release();
            this.wakeLock = null;
            console.log('屏幕常亮已关闭');
        }
    }
    
    handleVisibilityChange() {
        if (!this.isRunning) return;
        
        if (document.hidden) {
            // 页面隐藏，记录离开时间
            this.hiddenTime = Date.now();
        } else {
            // 页面显示，检查是否长时间离开
            const hiddenDuration = (Date.now() - this.hiddenTime) / 1000;
            if (hiddenDuration > 5) { // 离开超过5秒
                this.stopStudy();
            } else {
                // 如果是短暂离开，重新请求屏幕常亮
                if (this.wakeLock) {
                    this.requestWakeLock();
                }
            }
        }
    }
    
    checkVisibility() {
        // 初始化时检查页面可见性
        if (document.hidden) {
            console.log('页面不可见');
        }
    }
    
    showDialog(type) {
        const quotes = this.quotes[type];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        document.getElementById('dialogText').textContent = randomQuote;
        
        // 设置不同的图标和颜色
        const avatar = document.getElementById('dialogAvatar');
        const dialogBox = document.querySelector('.dialog-box');
        
        // 移除所有样式类
        dialogBox.classList.remove('start', 'escape', 'complete');
        
        // 根据类型设置图标和样式
        switch(type) {
            case 'start':
                avatar.textContent = '📚';
                dialogBox.classList.add('start');
                break;
            case 'escape':
                avatar.textContent = '👿';
                dialogBox.classList.add('escape');
                break;
            case 'complete':
                avatar.textContent = '🎉';
                dialogBox.classList.add('complete');
                break;
        }
        
        document.getElementById('devilDialog').classList.remove('hidden');
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = this.remainingTime % 60;
        document.getElementById('countdown').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    updateStats() {
        document.getElementById('todayTime').textContent = this.stats.todayTime;
        document.getElementById('escapeCount').textContent = this.stats.escapeCount;
        document.getElementById('completeCount').textContent = this.stats.completeCount;
    }
    
    saveStats() {
        localStorage.setItem('studyStats', JSON.stringify(this.stats));
    }
    
    loadStats() {
        const saved = localStorage.getItem('studyStats');
        if (saved) {
            this.stats = JSON.parse(saved);
        }
    }
    
    generatePoster() {
        const canvas = document.getElementById('posterCanvas');
        const ctx = canvas.getContext('2d');
        
        // 设置画布尺寸（海报尺寸）
        canvas.width = 750;
        canvas.height = 1334;
        
        // 背景渐变
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 装饰圆圈
        ctx.beginPath();
        ctx.arc(375, 300, 200, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 200, 100, 0.2)';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(375, 300, 150, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 200, 100, 0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 标题
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('今日学习报告', 375, 150);
        
        // 日期
        const today = new Date();
        const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '24px -apple-system, sans-serif';
        ctx.fillText(dateStr, 375, 200);
        
        // 学习时长
        ctx.fillStyle = '#ffc864';
        ctx.font = 'bold 80px -apple-system, sans-serif';
        ctx.fillText(`${this.stats.todayTime}分钟`, 375, 320);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '28px -apple-system, sans-serif';
        ctx.fillText('今日学习时长', 375, 370);
        
        // 完成科目
        if (this.currentSubject) {
            ctx.fillStyle = '#fff';
            ctx.font = '32px -apple-system, sans-serif';
            ctx.fillText(`完成科目：${this.currentSubject}`, 375, 500);
        }
        
        // 统计数据
        const statsY = 650;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px -apple-system, sans-serif';
        ctx.fillText(`完成番茄钟：${this.stats.completeCount} 个`, 375, statsY);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '28px -apple-system, sans-serif';
        ctx.fillText(`逃跑次数：${this.stats.escapeCount} 次`, 375, statsY + 60);
        
        // 分隔线
        ctx.beginPath();
        ctx.moveTo(100, statsY + 120);
        ctx.lineTo(650, statsY + 120);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 监督官语录
        const quotes = this.quotes.complete;
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        
        ctx.fillStyle = 'rgba(255, 107, 107, 0.3)';
        ctx.fillRect(75, 850, 600, 200);
        
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 32px -apple-system, sans-serif';
        ctx.fillText('👿 监督官今日评语', 375, 900);
        
        ctx.fillStyle = '#fff';
        ctx.font = '26px -apple-system, sans-serif';
        this.wrapText(ctx, randomQuote, 375, 950, 520, 36);
        
        // 底部标语
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '20px -apple-system, sans-serif';
        ctx.fillText('坚持学习，早日上岸 🎯', 375, 1250);
        
        // 显示海报弹窗
        document.getElementById('posterModal').classList.remove('hidden');
    }
    
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split('');
        let line = '';
        
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i];
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && i > 0) {
                ctx.fillText(line, x, y);
                line = words[i];
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        
        ctx.fillText(line, x, y);
    }
    
    downloadPoster() {
        const canvas = document.getElementById('posterCanvas');
        const link = document.createElement('a');
        link.download = `学习报告_${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new StudyApp();
});
