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
        
        // 统计数据
        this.stats = {
            todayTime: 0,
            escapeCount: 0,
            completeCount: 0
        };
        
        // 加载统计数据
        this.loadStats();
        
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
    }
    
    showSubjectModal() {
        document.getElementById('subjectModal').classList.remove('hidden');
    }
    
    startStudy() {
        this.isRunning = true;
        this.startTime = Date.now();
        
        // 隐藏地址栏（全屏效果）
        if (window.scrollTo) {
            setTimeout(() => {
                window.scrollTo(0, 1);
            }, 100);
        }
        
        // 请求屏幕常亮（防止锁屏）
        this.requestWakeLock();
        
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
    }
    
    stopStudy() {
        if (!this.isRunning) return;
        
        clearInterval(this.timer);
        this.isRunning = false;
        
        // 释放屏幕常亮
        this.releaseWakeLock();
        
        // 计算实际学习时间（分钟）
        const actualMinutes = Math.round((Date.now() - this.startTime) / 1000 / 60);
        this.stats.todayTime += actualMinutes;
        this.stats.escapeCount++;
        
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
