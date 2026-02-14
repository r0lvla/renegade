// Утилита TinyColor (встроенная)
const tinycolor = (colorInput) => {
    // ... (полный код tinycolor без изменений) ...
    let r=0,g=0,b=0,a=1; if(!colorInput)return null; const T=String(colorInput).trim().toLowerCase(); let match; const pH=(h)=>parseInt(h,16); if(match=T.match(/^#([0-9a-f]{3})$/i)){r=pH(match[1][0]+match[1][0]);g=pH(match[1][1]+match[1][1]);b=pH(match[1][2]+match[1][2]);} else if(match=T.match(/^#([0-9a-f]{6})$/i)){r=pH(match[1].substring(0,2));g=pH(match[1].substring(2,4));b=pH(match[1].substring(4,6));} else if(match=T.match(/^#([0-9a-f]{8})$/i)){r=pH(match[1].substring(0,2));g=pH(match[1].substring(2,4));b=pH(match[1].substring(4,6));a=pH(match[1].substring(6,8))/255;} else if(match=T.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i)){r=parseInt(match[1]);g=parseInt(match[2]);b=parseInt(match[3]);} else if(match=T.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/i)){r=parseInt(match[1]);g=parseInt(match[2]);b=parseInt(match[3]);a=parseFloat(match[4]);} else return null; const cl=(v,min=0,max=255)=>Math.max(min,Math.min(max,Math.round(v))); const clA=(v,min=0,max=1)=>Math.max(min,Math.min(max,v)); const fmt=(n)=>n.toString(16).padStart(2,'0'); r=cl(r);g=cl(g);b=cl(b);a=clA(a); return{r,g,b,a, lighten:function(am=10){const f=am/100;return tinycolor(`rgba(${cl(r+(255-r)*f)}, ${cl(g+(255-g)*f)}, ${cl(b+(255-b)*f)}, ${a})`);}, darken:function(am=10){const f=1-(am/100);return tinycolor(`rgba(${cl(r*f)}, ${cl(g*f)}, ${cl(b*f)}, ${a})`);}, toString:function(f='hex'){if(f==='rgb')return`rgb(${r}, ${g}, ${b})`; if(f==='rgba')return`rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`; const h=`#${fmt(r)}${fmt(g)}${fmt(b)}`; const h8=`#${fmt(r)}${fmt(g)}${fmt(b)}${fmt(Math.round(a*255))}`; return a<1?h8:h;}};
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerHpElement = document.getElementById('player-hp');
const playerLivesElement = document.getElementById('player-lives');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');
const levelCompleteElement = document.createElement('div');
levelCompleteElement.id = 'level-complete'; levelCompleteElement.className = 'popup-overlay'; levelCompleteElement.style.display = 'none';
levelCompleteElement.innerHTML = `LEVEL COMPLETE!<br>Score: <span id="final-score">0</span><br><button onclick="location.reload()">Play Again</button>`;
document.getElementById('game-container').appendChild(levelCompleteElement);

// --- Game Settings ---
canvas.width = 1280; canvas.height = 720;
const platformTop = canvas.height - 250; const platformBottom = canvas.height - 60;
const platformDepth = platformBottom - platformTop;
const platformEdgeX = canvas.width - 200; const fallGroundY = platformBottom + 45;
const playerSpeed = 3.8; const enemySpeedBase = 2.0;
const gravity = 0.75 * 0.85; // Adjusted gravity for jump
const jumpPower = -14.5 * 0.95; // Adjusted jump power
const baseCharacterScale = 1.0;
const punchDamage = 10; const kickDamage = 18; const kneeDamage = 15; const jumpKickDamage = 22; const throwDamage = 12;
const stompDamage = 12; const rearKickDamage = 15; const runningPunchDamage = 15; const runningKickDamage = 22;
const punchRange = 45; const kickRange = 65; const grabRange = 40; const stompRange = 50; const rearKickRange = 55;
const punchDuration = 155; const kickDuration = 345; const jumpKickDuration = 275; const kneeDuration = 195; const stompDuration = 280; const rearKickDuration = 250;
const attackCooldown = 115; const hitStunTime = 300; const bossHitStunMultiplier = 1.8;
const knockdownTime = 3000; const corpseLingerTime = 15000;
const bossKnockdownResilienceThreshold = 3;
const enemyAttackRange = 50; const enemyAttackDamageBase = 7; const enemyAttackCooldownBase = 1280;
const maxEnemiesOnScreen = 5; const totalEnemiesToSpawn = 20; const totalEnemiesBeforeBoss = 15;
let enemiesSpawnedCount = 0; let score = 0; let gameRunning = true;
let bossSpawned = false; let bossDefeated = false; let allEnemiesCleared = false;
let lives = 3; // Lives system
let playerRespawning = false; // Flag to prevent multiple respawns

const keysPressed = {};
window.addEventListener('keydown', (e) => { keysPressed[e.code] = true; });
window.addEventListener('keyup', (e) => { delete keysPressed[e.code]; });

function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clamp(value, min, max) { return Math.max(min, Math.min(value, max)); }
function choose(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const hairStyles = ['short', 'bald', 'punk', 'slick', 'braid', 'dreads'];
const hairColors = ['#000', '#422d0d', '#5b3a1a', '#f0e68c', '#ff7f50', '#a0522d'];
const gruntShirtColors = ['#8B4513', '#556B2F', '#4682B4', '#A0522D', '#696969'];
const gruntPantsColors = ['#2F4F4F', '#000080', '#555', '#333'];
const fastShirtColors = ['#FFD700', '#FFA500', '#ADFF2F', '#FFFFE0'];
const fastPantsColors = ['#000', '#4B0082', '#A52A2A'];
const femaleTopColors = ['#FF1493', '#FF69B4', '#DA70D6', '#BA55D3', '#8A2BE2'];
const femaleBottomColors = ['#000', '#191970', '#FFF'];

function drawShadow(x, y, width, height) { 
    // Shadow should be slightly below character's feet, not always at platformBottom
    const shadowY = y + height + 5; 
    const cBY = y + height; 
    const rY = clamp((cBY - platformTop) / platformDepth, 0, 1); 
    const sS = 0.7 + rY * 0.3; 
    const sO = 0.2 + rY * 0.25; 
    ctx.fillStyle = `rgba(0,0,0,${sO})`; 
    ctx.beginPath(); 
    ctx.ellipse(x + width / 2, shadowY, (width / 2.8) * sS, 6 * sS, 0, 0, Math.PI * 2); 
    ctx.fill(); 
}

const particles = []; const splatters = []; const maxSplatterTime = 7000;
function createBlood(x, y, count = 10) { for(let i=0;i<count;i++){const life=getRandomInt(30,50); particles.push({x,y,size:getRandomInt(3,6),color:`rgba(200,0,0,${Math.random()*0.5+0.5})`,vx:(Math.random()-0.5)*8,vy:(Math.random()-0.5)*8-3,life,maxLife:life,isBlood:true});}}
function createBloodSplat(x, y, size = 20) { for(let i=0; i<size; ++i) { if(splatters.length<250){splatters.push({x:x+(Math.random()-0.5)*size*1.5, y:y-getRandomInt(0,3), size:getRandomInt(4,10), color:`rgba(100,0,0,${Math.random()*0.3+0.3})`, createdAt:Date.now()});}}}
function updateAndDrawParticles(deltaTime) { const dtFactor=deltaTime/16.67; for(let i=particles.length-1;i>=0;i--){const p=particles[i]; p.x+=p.vx*dtFactor; p.y+=p.vy*dtFactor; if(p.isBlood){p.vy+=gravity*0.7*dtFactor; if(p.y>=platformBottom-p.size/2&&p.life>0){p.life=0; if(splatters.length<250){splatters.push({x:p.x,y:platformBottom-getRandomInt(0,3),size:p.size*getRandomInt(1,5),color:`rgba(110,0,0,${Math.random()*0.25+0.2})`,createdAt:Date.now()});}}}else{p.vy+=gravity*0.25*dtFactor;} p.life-=deltaTime; if(p.life<=0){particles.splice(i,1);}else{ctx.fillStyle=p.color; ctx.globalAlpha=Math.max(0,p.life/p.maxLife*0.9); ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size); ctx.globalAlpha=1.0;}} for(let i=splatters.length-1;i>=0;i--){const s=splatters[i]; const age=Date.now()-s.createdAt; if(age>maxSplatterTime){splatters.splice(i,1);}else{ctx.globalAlpha=Math.max(0,(1.0-(age/maxSplatterTime))*0.8); ctx.fillStyle=s.color; ctx.fillRect(s.x-s.size/2,s.y-s.size/2,s.size,s.size); ctx.globalAlpha=1.0;}}}

// --- Base Character Class ---
class Character {
    constructor(x, y, width, height, color, hp) {
        this.x = x; this.y = y;
        this.width = Math.round(width * baseCharacterScale);
        this.height = Math.round(height * baseCharacterScale);
        this.baseColor = color; this.hp = hp; this.maxHp = hp;
        this.shirtColor = '#555'; this.pantsColor = '#333';
        this.skinColor = tinycolor(this.baseColor)?.lighten(10)?.toString() || '#f0d9b5';
        this.hairStyle = 'bald'; this.hairColor = '#000';
        this.vx = 0; this.vy = 0;
        this.isGrounded = true; this.facingRight = true;
        this.isAttacking = false; this.attackType = null; this.attackTimer = 0; this.attackCooldownTimer = 0;
        this.isHit = false; this.hitTimer = 0; this.currentHitStunTime = hitStunTime;
        this.hitFlashDuration = 130; this.isKnockedDown = false; this.knockdownTimer = 0;
        this.isFalling = false; this.isOnPlatform = true; this.isDead = false;
        this.deadTimer = 0; this.landedOnGround = false;
        this.comboHits = 0; this.lastHitBy = null; this.isWalking = false; this.walkCycleTimer = 0; this.walkAnimSpeed = 140; this.currentWalkFrame = 0;
        this.state = 'idle'; this.exitDoorTargetX = 0; this.exitWindowTargetX = 0; this.exitWindowTargetY = 0;
    }

    updateState(deltaTime) {
        const now = Date.now();
        const dtFactor = deltaTime / 16.67;

        if (this.isDead) { this.deadTimer += deltaTime; }

        if (!this.isDead || this.isFalling) {
            this.x += this.vx * dtFactor;
            // Only apply vy and gravity if falling (not on platform walking)
            if (!this.isOnPlatform) {
                this.y += this.vy * dtFactor;
                this.vy += gravity * dtFactor;
            }
            this.vx *= Math.pow(0.92, dtFactor); if (Math.abs(this.vx) < 0.1) this.vx = 0;
        } else {
             this.vx = 0;
             if (!this.isFalling || (this.isFalling && this.y + this.height >= fallGroundY - 1)) { this.vy = 0; this.y = clamp(this.y, platformTop, fallGroundY - this.height); }
             else { this.vy += gravity * dtFactor; this.y += this.vy * dtFactor; }
        }

        if (this.isOnPlatform) {
            // --- FIX: Clamp Y within platform AFTER applying velocity ---
            this.y = clamp(this.y, platformTop, platformBottom - this.height);

            // On platform = always grounded (can walk and jump from anywhere)
            this.isGrounded = true;
            // Only reset vy if not jumping (vy < 0 means moving up = jumping)
            if (this.vy >= 0) {
                this.vy = 0; // Reset vertical velocity when on platform (but not during jump)
            }

            if (this.x + this.width / 2 > platformEdgeX && !this.isFalling) { this.isFalling = true; this.isOnPlatform = false; this.isGrounded = false; this.vy = -2.0; this.vx += (this.facingRight ? 1.5 : -1.5); }
            this.x = Math.max(0, this.x);
        } else if (this.isFalling) {
            this.isGrounded = false;
            if (this.y + this.height >= fallGroundY && this.vy > 0) {
                this.y = fallGroundY - this.height;
                if (!this.landedOnGround) { createBloodSplat(this.x + this.width / 2, fallGroundY); this.landedOnGround = true; }
                this.vy *= -0.3; if (Math.abs(this.vy) < 0.5) this.vy = 0;
                this.vx *= Math.pow(0.7, dtFactor);
            }
            if (this.y > canvas.height + this.height * 2) { this.hp = 0; this.isDead = true; }
        }

        if (!this.isDead) {
            if (this.attackCooldownTimer > 0) { this.attackCooldownTimer -= deltaTime; }
            if (this.isAttacking && this.attackTimer > 0) { this.attackTimer -= deltaTime; if (this.attackTimer <= 0) { this.isAttacking = false; this.attackType = null; this.attackCooldownTimer = attackCooldown; } }
            if (this.isHit) { const elapsed = now - this.hitTimer; if (elapsed >= this.currentHitStunTime) { this.isHit = false; this.comboHits = 0; this.currentHitStunTime = hitStunTime; } }
            if (this.isKnockedDown) { if (!(this instanceof BossEnemy && this.isWakingUp)) { if (now - this.knockdownTimer >= knockdownTime) { this.isKnockedDown = false; this.y = clamp(this.y, platformTop, platformBottom - this.height); this.isHit = true; this.hitTimer = now; this.currentHitStunTime = 300; } } }

            if (this.isWalking && this.isGrounded && !this.isAttacking && !this.isHit) { this.walkCycleTimer += deltaTime; if (this.walkCycleTimer >= this.walkAnimSpeed) { this.walkCycleTimer = 0; this.currentWalkFrame = (this.currentWalkFrame + 1) % 2; } }
            else { this.walkCycleTimer = 0; if (!this.isAttacking) this.currentWalkFrame = 0; }
        } else { this.isWalking = false; this.currentWalkFrame = 0; }
    }

    takeDamage(damage, hitter, attackType = 'unknown') {
        if(this.isHit||this.isKnockedDown||this.isFalling||this.isDead||this.hp<=0)return false;
        this.hp-=damage; createBlood(this.x+this.width/2,this.y+this.height/2,10);
        if(this.hp<=0){this.hp=0; this.isDead=true; this.deadTimer=0; this.isHit=false; this.isAttacking=false; this.isWalking=false; if(!this.isFalling){this.isKnockedDown=true; this.vy=-5; this.vx+=(hitter.facingRight?5:-5);}else{this.isKnockedDown=true;} this.knockdownTimer=Date.now(); if(hitter instanceof Player){score+=(this instanceof BossEnemy?200:25); scoreElement.textContent=score;} if(this instanceof BossEnemy){bossDefeated=true;} return true;}
        let stunMultiplier=(this instanceof BossEnemy)?0.5:1.0; let specificHitStun=hitStunTime*stunMultiplier; this.isHit=true; this.hitTimer=Date.now(); this.vy=-3.0; this.vx+=(hitter.facingRight?4.0:-4.0); this.isAttacking=false; this.attackTimer=0; this.isWalking=false; if(this.lastHitBy===hitter&&!this.isKnockedDown){this.comboHits++;} else{this.comboHits=1; this.lastHitBy=hitter;} let knockdown=false; const isHeavyAttack=(attackType==='jumpKick'||attackType==='throw'); if(!(this instanceof BossEnemy)){if(this.comboHits>=4||isHeavyAttack){knockdown=true;}}else{if(isHeavyAttack){this.knockdownResilience=(this.knockdownResilience||0)+1; if(this.knockdownResilience>=bossKnockdownResilienceThreshold){knockdown=true; this.knockdownResilience=0; console.log("Boss Knocked Down!");}else{specificHitStun=hitStunTime*bossHitStunMultiplier*1.5; console.log(`Boss resilience: ${this.knockdownResilience}/${bossKnockdownResilienceThreshold}`);}}else{specificHitStun=hitStunTime*0.4;}} this.currentHitStunTime=specificHitStun; if(knockdown){this.isKnockedDown=true; this.knockdownTimer=Date.now(); this.isHit=false; this.comboHits=0; this.vy=-7; this.vx+=(hitter.facingRight?7:-7);} return true;
    }

    draw() {
        if (this.y > canvas.height + this.height * 2) { return; }
        const drawX=Math.round(this.x); const drawY=Math.round(this.y); const now=Date.now();
        ctx.save();
        if (this.isFalling && !this.isDead) { ctx.translate(drawX + this.width / 2, drawY + this.height / 2); ctx.rotate(now * 0.006 * (this.vx > 0 ? 1 : -1)); ctx.translate(-(drawX + this.width / 2), -(drawY + this.height / 2)); }
        if (this.isOnPlatform || (this.isFalling && this.y + this.height < fallGroundY)) { drawShadow(drawX, drawY, this.width, this.height); }
        if (!(this instanceof Player) && this.hp > 0 && !this.isDead) { const bw=this.width*0.8,bh=8,bx=drawX+(this.width-bw)/2,by=drawY-bh-7,hpP=this.hp/this.maxHp; ctx.fillStyle='#550000'; ctx.fillRect(bx,by,bw,bh); ctx.fillStyle='#cc0000'; ctx.fillRect(bx,by,bw*hpP,bh); ctx.strokeStyle='#333'; ctx.lineWidth=1; ctx.strokeRect(bx,by,bw,bh); }

        const headSize=this.height*0.23; const torsoBaseHeight=this.height*0.5*1.15; const armHeight=this.height*0.45*0.85; const legHeight=this.height*0.45; const armWidth=this.width*0.22; const legWidth=this.width*0.25; const headX=drawX+(this.width-headSize)/2; const headY=drawY; const torsoY=drawY+headSize*0.8; const torsoWidthBase=this.width*0.8; let torsoWidth=torsoWidthBase; let currentTorsoX=drawX+(this.width-torsoWidthBase)/2; const pantsY=torsoY+torsoBaseHeight*0.65; const pantsHeight=legHeight*0.85; const shirtHeight=pantsY-torsoY;
        let currentShirtColor=this.shirtColor; let currentPantsColor=this.pantsColor; let currentSkinColor=this.skinColor; let currentLimbColor=tinycolor(this.skinColor)?.darken(15)?.toString()||this.skinColor; let currentHairColor=this.hairColor;

        if (this.isHit && now - this.hitTimer < this.hitFlashDuration && !this.isDead) { currentShirtColor='#fff';currentPantsColor='#fff';currentSkinColor='#fff';currentLimbColor='#fff';currentHairColor='#fff';}
        if (this instanceof BossEnemy && this.isWakingUp) { currentShirtColor=(Math.floor(now/100)%2===0)?'#ffcc00':this.shirtColor;}

        if (this.isKnockedDown || this.isDead) { const bodyX=drawX-this.height*0.1; const bodyY=drawY+this.height*0.5; const bodyW=this.height*0.9; const bodyH=this.width*0.7; const headDownX=bodyX+(this.facingRight?bodyW*0.8:bodyW*0.2-headSize*0.8); const headDownY=bodyY+(bodyH-headSize*0.8)/2; ctx.fillStyle=currentPantsColor; ctx.fillRect(bodyX,bodyY,bodyW*0.4,bodyH); ctx.fillStyle=currentShirtColor; ctx.fillRect(bodyX+bodyW*0.4,bodyY,bodyW*0.6,bodyH); ctx.fillStyle=currentSkinColor; ctx.fillRect(headDownX,headDownY,headSize*0.8,headSize*0.8); ctx.fillStyle=currentLimbColor; ctx.fillRect(bodyX+bodyW*0.3,bodyY-bodyH*0.1,bodyW*0.4,bodyH*0.3); ctx.fillRect(bodyX+bodyW*0.3,bodyY+bodyH*0.8,bodyW*0.4,bodyH*0.3); ctx.restore(); return;}

        ctx.fillStyle = currentPantsColor; const legBaseY = pantsY; const legWalkOffset = 6; const leftLegX = drawX + this.width * 0.15; const rightLegX = drawX + this.width * 0.60;
        // --- Draw Legs based on State ---
        const drawLeg = (x, y, w, h) => ctx.fillRect(x, y, w, h);
        if (this.isAttacking && this.attackType === 'kick') {
            const progress = Math.min(1, (kickDuration - this.attackTimer) / kickDuration);
            const kickReach = kickRange * Math.sin(progress * Math.PI);
            const kickY = torsoY + torsoBaseHeight * 0.6; // Kick origin Y
            if (this.facingRight) {
                drawLeg(leftLegX, legBaseY, legWidth, pantsHeight); // Non-kicking leg
                drawLeg(drawX + this.width * 0.5, kickY, legWidth + kickReach, legWidth * 0.9); // Kicking leg
            } else {
                drawLeg(rightLegX, legBaseY, legWidth, pantsHeight); // Non-kicking leg
                drawLeg(drawX + this.width * 0.5 - legWidth - kickReach, kickY, legWidth + kickReach, legWidth * 0.9); // Kicking leg
            }
        } else if (this.isAttacking && this.attackType === 'jumpKick') {
             const nonKickLegX = drawX + (this.facingRight ? 0.15 : 0.60) * this.width;
             drawLeg(nonKickLegX, legBaseY, legWidth, pantsHeight * 0.8); // Bent non-kicking leg
             // Kicking leg is drawn later after rotation
        } else if (this.isAttacking && this.attackType === 'knee') {
             const kneeY = torsoY + torsoBaseHeight * 0.4;
             const kneeXPos = drawX + (this.facingRight ? this.width*0.6 : this.width*0.15);
             drawLeg(kneeXPos, kneeY, legWidth, pantsHeight*0.7); // Knee up
             drawLeg(drawX + (this.facingRight ? 0.15 : 0.60) * this.width, legBaseY, legWidth, pantsHeight); // Other leg straight
        } else if (this.isWalking && this.isGrounded) { // Walking animation
            if (this.currentWalkFrame === 0) { drawLeg(leftLegX, legBaseY, legWidth, pantsHeight); drawLeg(rightLegX, legBaseY + legWalkOffset * 0.5, legWidth, pantsHeight * 0.9); }
            else { drawLeg(leftLegX, legBaseY + legWalkOffset * 0.5, legWidth, pantsHeight * 0.9); drawLeg(rightLegX, legBaseY, legWidth, pantsHeight); }
        } else if (!this.isGrounded) { // Jumping pose
            drawLeg(leftLegX, legBaseY, legWidth, pantsHeight * 0.8); drawLeg(rightLegX, legBaseY, legWidth, pantsHeight * 0.8);
        } else { // Idle pose
            drawLeg(leftLegX, legBaseY, legWidth, pantsHeight); drawLeg(rightLegX, legBaseY, legWidth, pantsHeight);
        }

        if(this instanceof FemaleEnemy){const waistReduction=torsoWidthBase*0.1; torsoWidth=torsoWidthBase-waistReduction; currentTorsoX=drawX+(this.width-torsoWidth)/2; const chestY=torsoY+shirtHeight*0.15; const chestH=shirtHeight*0.25; const chestW=torsoWidth*0.5; const chestX=currentTorsoX+(torsoWidth-chestW)/2; ctx.fillStyle=tinycolor(currentShirtColor)?.lighten(8)?.toString()||currentShirtColor; ctx.fillRect(chestX,chestY,chestW,chestH);}else{torsoWidth=torsoWidthBase; currentTorsoX=drawX+(this.width-torsoWidth)/2;}
        ctx.fillStyle=currentShirtColor; ctx.fillRect(currentTorsoX,torsoY,torsoWidth,shirtHeight);

        ctx.fillStyle=currentLimbColor; const armY=torsoY+shirtHeight*0.1;
        if(this.isAttacking&&this.attackType==='punch'){const p=Math.min(1,(punchDuration-this.attackTimer)/punchDuration),r=punchRange*Math.sin(p*Math.PI); if(this.facingRight){ctx.fillRect(drawX+this.width*0.7,armY,armWidth+r,armWidth);ctx.fillRect(drawX+this.width*0.1,armY,armWidth,armHeight);}else{ctx.fillRect(drawX+this.width*0.3-armWidth-r,armY,armWidth+r,armWidth);ctx.fillRect(drawX+this.width*0.7,armY,armWidth,armHeight);}}
        else if (this.isAttacking && this.attackType === 'kick') { ctx.fillRect(drawX+this.width*0.1,armY,armWidth,armHeight);ctx.fillRect(drawX+this.width*0.7,armY,armWidth,armHeight); /* Kicking leg drawn in leg section */ }
        else if (this.isAttacking && this.attackType === 'jumpKick') { const p=Math.min(1,(jumpKickDuration-this.attackTimer)/jumpKickDuration),kr=kickRange*Math.sin(p*Math.PI),kvy=drawY+this.height*0.6,ka=this.vy>0?0.35:-0.25; ctx.fillRect(drawX+this.width*0.1,armY,armWidth,armHeight*0.8);ctx.fillRect(drawX+this.width*0.7,armY,armWidth,armHeight*0.8); ctx.save();ctx.translate(drawX+this.width/2,kvy); ctx.rotate(this.facingRight?ka:-ka); ctx.fillStyle=currentPantsColor; if(this.facingRight){ctx.fillRect(legWidth*0.2,-legWidth/2,legWidth+kr,legWidth);}else{ctx.fillRect(-legWidth*1.2-kr,-legWidth/2,legWidth+kr,legWidth);} ctx.restore(); }
        else if (this.isAttacking && this.attackType === 'knee') { ctx.fillStyle=currentLimbColor; const ahY=armY+armHeight*0.2; ctx.fillRect(drawX+this.width*0.1,ahY,armWidth,armHeight*0.8);ctx.fillRect(drawX+this.width*0.7,ahY,armWidth,armHeight*0.8); /* Knee leg drawn in leg section */}
        else if (this.isAttacking && this.attackType === 'stomp') { ctx.fillRect(drawX+this.width*0.3,armY,armWidth,armHeight*0.9); ctx.fillRect(drawX+this.width*0.5,armY,armWidth,armHeight*0.9); const stompLegX = this.facingRight ? drawX+this.width*0.5 : drawX+this.width*0.2; drawLeg(stompLegX, legBaseY - 15, legWidth*1.2, pantsHeight*0.5); }
        else if (this.isAttacking && this.attackType === 'rearKick') { ctx.fillRect(drawX+this.width*0.3,armY,armWidth,armHeight); ctx.fillRect(drawX+this.width*0.5,armY,armWidth,armHeight); const kickLegX = this.facingRight ? drawX-this.width*0.3 : drawX+this.width; drawLeg(kickLegX, torsoY+torsoBaseHeight*0.4, legWidth*1.3, legWidth*0.8); }
        else { const armSwing=this.isWalking&&this.isGrounded?(this.currentWalkFrame===0?4:-4)*(this.facingRight?1:-1):0; const armWalkOffset=this.isWalking&&this.isGrounded?3:0; ctx.fillRect(drawX+this.width*0.1+(this.facingRight?armSwing:-armSwing),armY+armWalkOffset,armWidth,armHeight); ctx.fillRect(drawX+this.width*0.7-(this.facingRight?armSwing:-armSwing),armY+armWalkOffset,armWidth,armHeight); }

        ctx.fillStyle=currentSkinColor; ctx.fillRect(headX,headY,headSize,headSize);
        // --- Eyes Fix ---
        ctx.fillStyle='#000'; const eyeSize=4; const eyeOffsetY=headSize*0.3; const eyeSeparation=headSize*0.3; const eyeCenterX=headX+headSize/2;
        if(this.facingRight){ctx.fillRect(eyeCenterX-eyeSize/2 - eyeSeparation/2, headY+eyeOffsetY, eyeSize, eyeSize); ctx.fillRect(eyeCenterX-eyeSize/2 + eyeSeparation/2, headY+eyeOffsetY, eyeSize, eyeSize);}
        else{ctx.fillRect(eyeCenterX-eyeSize/2 - eyeSeparation/2, headY+eyeOffsetY, eyeSize, eyeSize); ctx.fillRect(eyeCenterX-eyeSize/2 + eyeSeparation/2, headY+eyeOffsetY, eyeSize, eyeSize);}

        ctx.fillStyle=currentHairColor; const hairBaseY=headY-headSize*0.1; const hairX=headX;
        switch(this.hairStyle){
            case 'short':ctx.fillRect(hairX,hairBaseY,headSize,headSize*0.4); break;
            case 'punk':for(let i=0;i<3;i++){ctx.beginPath(); ctx.moveTo(hairX+headSize*0.2+i*headSize*0.3,hairBaseY+headSize*0.1); ctx.lineTo(hairX+headSize*0.3+i*headSize*0.3,hairBaseY-headSize*0.4); ctx.lineTo(hairX+headSize*0.4+i*headSize*0.3,hairBaseY+headSize*0.1); ctx.fill();} break;
            case 'slick':ctx.fillRect(hairX+(this.facingRight?0:headSize*0.2),hairBaseY,headSize*0.8,headSize*0.3); break;
            case 'braid': ctx.fillRect(hairX + (this.facingRight? headSize*0.1 : headSize*0.7), headY + headSize*0.4, headSize*0.2, headSize*0.8); break; // Adjusted Y and Length
            case 'dreads':for(let i=0;i<4;i++){ctx.fillRect(hairX+headSize*0.1+i*headSize*0.22,headY+headSize*0.3,headSize*0.15,headSize*0.6);} break;
        }
        ctx.restore();
    }
}

// --- Player Class ---
class Player extends Character { constructor(x,y){super(x,y,45,85,'#e0c0a0',100);this.shirtColor='#0077cc';this.pantsColor='#333344';this.skinColor=this.baseColor;this.hairStyle='short';this.hairColor='#5b3a1a';this.isGrappling=false;this.grappledEnemy=null;this.isGrabbedBehind=false;this.grabbedBehindBy=null;} 
update(enemies,deltaTime){
    // Death/Falling/Knockdown
    if(this.isDead||this.isFalling||this.isKnockedDown){
        this.isWalking=false;
        if(this.isGrappling&&this.grappledEnemy){this.grappledEnemy.isGrabbed=false;this.grappledEnemy.grabbedBy=null;}
        this.isGrappling=false;this.grappledEnemy=null;
        if(this.isGrabbedBehind&&this.grabbedBehindBy){this.grabbedBehindBy.isGrabbingPlayer=false;this.grabbedBehindBy.grabCooldown=2000;}
        this.isGrabbedBehind=false;this.grabbedBehindBy=null;
        this.updateState(deltaTime);return;
    }
    // Hit stun
    if(this.isHit){this.isWalking=false;this.updateState(deltaTime);return;}
    // Grabbed from behind - can only rear kick
    if(this.isGrabbedBehind){
        this.isWalking=false;
        if((keysPressed['KeyX']||keysPressed['KeyM'])&&this.attackCooldownTimer<=0){this.attack('rearKick');}
        this.updateState(deltaTime);return;
    }
    // Grappling enemy
    if(this.isGrappling){
        this.isWalking=false;
        if(!this.grappledEnemy||this.grappledEnemy.hp<=0||this.grappledEnemy.isDead||this.grappledEnemy.isKnockedDown||this.grappledEnemy.isFalling||!this.grappledEnemy.isOnPlatform||this.grappledEnemy.isGrabbed===false){
            if(this.grappledEnemy&&this.grappledEnemy.grabbedBy===this){this.grappledEnemy.isGrabbed=false;this.grappledEnemy.grabbedBy=null;}
            this.isGrappling=false;this.grappledEnemy=null;this.attackCooldownTimer=150;
        }else{
            this.grappledEnemy.x=this.x+(this.facingRight?this.width*0.7:-this.grappledEnemy.width*0.7);
            this.grappledEnemy.y=this.y+(this.height-this.grappledEnemy.height)/2;
            this.grappledEnemy.vx=0;this.grappledEnemy.vy=0;
            this.grappledEnemy.isGrounded=this.isGrounded;
            this.grappledEnemy.facingRight=!this.facingRight;
            if((keysPressed['KeyZ']||keysPressed['KeyN'])&&this.attackCooldownTimer<=0){this.attack('knee');}
            else if(keysPressed['Space']&&this.attackCooldownTimer<=0){this.attack('throw');}
            this.updateState(deltaTime);return;
        }
    }
    // Normal movement
    let dx=0,dy=0;this.isWalking=false;const dtFactor=deltaTime/16.67;
    if(!this.isAttacking){
        if(keysPressed['ArrowLeft']||keysPressed['KeyA']){dx=-playerSpeed;}
        if(keysPressed['ArrowRight']||keysPressed['KeyD']){dx=playerSpeed;}
        if(keysPressed['ArrowUp']||keysPressed['KeyW']){dy=-playerSpeed*0.7;}
        if(keysPressed['ArrowDown']||keysPressed['KeyS']){dy=playerSpeed*0.7;}
        if(dx!==0||dy!==0)this.isWalking=true;
        if(dx!==0)this.facingRight=dx>0;
    }
    if(dx!==0&&dy!==0){dx*=0.707;dy*=0.707;}
    this.x+=dx*dtFactor;this.y+=dy*dtFactor;
    this.updateState(deltaTime);
    // Attack inputs
    if(this.attackCooldownTimer<=0&&!this.isHit){
        if(keysPressed['Space']&&this.isGrounded&&!this.isAttacking){this.vy=jumpPower;this.isGrounded=false;this.isWalking=false;}
        else if(keysPressed['KeyZ']||keysPressed['KeyN']){this.attack('punch');}
        else if((keysPressed['KeyX']||keysPressed['KeyM'])&&this.isGrounded){this.attack('kick');}
        else if((keysPressed['KeyX']||keysPressed['KeyM'])&&!this.isGrounded&&!this.isAttacking){this.attack('jumpKick');}
        else if(keysPressed['KeyC']&&!this.isAttacking&&this.isGrounded){this.attemptGrab(enemies);}
        // Sit & Pummel - stomp knocked down enemies (Down + Punch)
        else if((keysPressed['ArrowDown']||keysPressed['KeyS'])&&(keysPressed['KeyZ']||keysPressed['KeyN'])&&this.isGrounded&&!this.isAttacking){this.attack('stomp');}
    }
    playerHpElement.textContent=Math.max(0,Math.ceil(this.hp));playerLivesElement.textContent=lives;
    if(this.hp<=0&&gameRunning&&!this.isFalling&&!this.isDead){loseLife();}
} attack(type){if(this.isAttacking||this.attackCooldownTimer>0)return; let duration=0,damage=0,range=0; let attackHeight=this.height*0.4,attackYOffset=this.height*0.3; const isRunning=this.isWalking&&this.isGrounded; this.isWalking=false; switch(type){case 'punch':duration=punchDuration;damage=isRunning?runningPunchDamage:punchDamage;range=punchRange;break; case 'kick':duration=kickDuration;damage=isRunning?runningKickDamage:kickDamage;range=kickRange;attackYOffset=this.height*0.6;break; case 'jumpKick':duration=jumpKickDuration;damage=jumpKickDamage;range=kickRange*1.1; attackYOffset=this.height*0.5;attackHeight=this.height*0.4; this.vx+=(this.facingRight?2.5:-2.5); this.vy=Math.min(this.vy,1.5); break; case 'stomp':duration=stompDuration;damage=stompDamage;range=stompRange;attackYOffset=this.height*0.8;attackHeight=this.height*0.3; break; case 'rearKick':if(!this.isGrabbedBehind)return; duration=rearKickDuration;damage=rearKickDamage;range=rearKickRange;attackYOffset=this.height*0.5;attackHeight=this.height*0.3; if(this.grabbedBehindBy){this.grabbedBehindBy.takeDamage(damage,this,type); this.grabbedBehindBy.isGrabbingPlayer=false; this.grabbedBehindBy.grabCooldown=2000; this.isGrabbedBehind=false; this.grabbedBehindBy=null;} break; case 'knee':if(!this.isGrappling||!this.grappledEnemy)return; duration=kneeDuration;damage=kneeDamage; this.grappledEnemy.takeDamage(damage,this,type); break; case 'throw':if(!this.isGrappling||!this.grappledEnemy)return; duration=150;damage=throwDamage; const throwForceX=this.facingRight?11:-11;const throwForceY=-7.5; this.grappledEnemy.isGrabbed=false;this.grappledEnemy.grabbedBy=null; this.grappledEnemy.vy=throwForceY;this.grappledEnemy.vx=throwForceX; this.grappledEnemy.takeDamage(damage,this,type); this.isGrappling=false;this.grappledEnemy=null; break; default:console.warn("Unknown attack type:",type); return;} this.isAttacking=true; this.attackType=type; this.attackTimer=duration; if(type==='punch'||type==='kick'||type==='jumpKick'||type==='stomp'){const aXC=this.x+this.width/2+(this.facingRight?this.width/4:-this.width/4); const aHX=this.facingRight?aXC:aXC-range; const aHW=range; const aHY=this.y+attackYOffset-attackHeight/2; const aHH=attackHeight; console.log(`Attack: ${type}, Y: ${aHY.toFixed(1)}, H: ${aHH.toFixed(1)}`); enemies.forEach(enemy=>{const canHitStomp=type==='stomp'&&enemy.isKnockedDown&&!enemy.isDead; const canHitNormal=type!=='stomp'&&enemy.hp>0&&!enemy.isDead&&!enemy.isGrabbed&&!enemy.isKnockedDown&&!enemy.isFalling&&enemy.isOnPlatform; if(canHitStomp||canHitNormal){if(aHX<enemy.x+enemy.width&&aHX+aHW>enemy.x&&aHY<enemy.y+enemy.height&&aHY+aHH>enemy.y){const eCX=enemy.x+enemy.width/2;const pCX=this.x+this.width/2; const hOCS=(this.facingRight&&eCX>pCX-this.width*0.2)||(!this.facingRight&&eCX<pCX+this.width*0.2); if(hOCS){console.log(`HITBOX COLLISION! Type: ${type}, Enemy: ${enemy.constructor.name}, EnemyY: ${enemy.y.toFixed(1)}, EnemyH: ${enemy.height.toFixed(1)}`); const hit=enemy.takeDamage(damage,this,type); console.log(`-> Damage applied? ${hit}`);}}}});}} attemptGrab(enemies){if(this.isAttacking||this.isGrappling||!this.isGrounded)return; const gCX=this.x+(this.facingRight?this.width*0.5:0); const gCW=this.width*0.5+grabRange; const gCY=this.y+this.height*0.1; const gCH=this.height*0.8; let target=null; let closestDSq=(grabRange*1.5)**2; enemies.forEach(e=>{if(e&&e.hp>0&&!e.isDead&&!e.isGrabbed&&!e.isKnockedDown&&!e.isFalling&&e.isOnPlatform){if(e.y+e.height>gCY&&e.y<gCY+gCH){const eCX=e.x+e.width/2;const pCX=this.x+this.width/2; const dx=eCX-pCX;const dSq=dx*dx; const oCS=(this.facingRight&&dx>0)||(!this.facingRight&&dx<0); const wR=Math.abs(dx)<(this.width/2+e.width/2+grabRange); if(oCS&&wR&&dSq<closestDSq){closestDSq=dSq;target=e;}}}}); if(target){this.isGrappling=true;this.grappledEnemy=target;target.isGrabbed=true;target.grabbedBy=this;target.isHit=false;target.comboHits=0;this.isWalking=false;this.attackCooldownTimer=250;}} }
// --- Enemy Classes ---
class Enemy extends Character{constructor(x,y,w,h,c,hp,sM=1,aM=1,cM=1){super(x,y,w,h,c,hp);this.speed=enemySpeedBase*sM;this.attackDamage=enemyAttackDamageBase*aM;this.attackCooldown=enemyAttackCooldownBase*cM;this.lastAttackTime=0;this.isGrabbed=false;this.grabbedBy=null;this.aiUpdateTimer=Math.random()*100;this.aiUpdateInterval=150+Math.random()*100;this.targetYOffset=(Math.random()-0.5)*(platformDepth*0.4);this.yDiff=0;this.state='idle';this.exitDoorTargetX=0;this.exitWindowTargetX=0;this.exitWindowTargetY=0;} update(player,deltaTime){if(this.isDead||this.hp<=0||this.isFalling){this.updateState(deltaTime);return;} if(this.isGrabbed){this.updateState(deltaTime);return;} if(this.isKnockedDown){this.updateState(deltaTime);return;} if(this.isHit){this.isWalking=false;this.updateState(deltaTime);return;} if(this.state==='exitingDoor'){const dxToTarget=this.exitDoorTargetX-this.x; if(Math.abs(dxToTarget)>this.speed){this.vx=Math.sign(dxToTarget)*this.speed*1.5;this.facingRight=dxToTarget>0;this.isWalking=true;}else{this.vx=0;this.x=this.exitDoorTargetX;this.state='chasing';this.isWalking=false;} this.updateState(deltaTime);return;} if(this.state==='exitingWindow'){const dx=this.exitWindowTargetX-this.x; const dy=this.exitWindowTargetY-this.y; const dist=Math.sqrt(dx*dx+dy*dy); if(dist>this.speed*1.5){const angle=Math.atan2(dy,dx); this.vx=Math.cos(angle)*this.speed*1.8; this.vy=Math.sin(angle)*this.speed*1.2; this.isWalking=true;}else{this.vx=0;this.vy=0; this.x=this.exitWindowTargetX; this.y=this.exitWindowTargetY; this.state='chasing'; this.isWalking=false; this.isOnPlatform=true;} this.updateState(deltaTime);return;} this.aiUpdateTimer+=deltaTime; let dx=0,dy=0;this.isWalking=false; const dtFactor=deltaTime/16.67; if(this.aiUpdateTimer>=this.aiUpdateInterval){this.aiUpdateTimer=0; const pX=player.x,pY=player.y; const dX=pX-this.x,dY=pY-this.y; const distSq=dX*dX+dY*dY; const sightSq=(canvas.width*0.8)**2; const atkRngSq=(enemyAttackRange+this.width*0.5+player.width*0.5)**2; const idealY=clamp(pY+this.targetYOffset,platformTop,platformBottom-this.height); this.yDiff=idealY-this.y; if(!player.isFalling&&!player.isKnockedDown&&!player.isDead){this.facingRight=dX>0; if(distSq>sightSq){this.state='idle';}else if(distSq>atkRngSq*1.2){this.state='chasing';}else{this.state='attacking'; if(Math.random()<0.1&&this.isGrounded){this.state='retreating';}}}else{this.state='idle';}} let targetX=this.x,targetY=this.y; if(this.state==='chasing'){dx=Math.sign(player.x-this.x)*this.speed; if(Math.abs(this.yDiff)>5){dy=Math.sign(this.yDiff)*this.speed*0.7;} this.isWalking=true;}else if(this.state==='attacking'){dx=0; if(Math.abs(this.yDiff)>3){dy=Math.sign(this.yDiff)*this.speed*0.8; this.isWalking=true;}else{this.tryAttack(player,deltaTime);}}else if(this.state==='retreating'){dx=-Math.sign(player.x-this.x)*this.speed*0.8; if(Math.abs(this.yDiff)>5){dy=Math.sign(this.yDiff)*this.speed*0.5;} this.isWalking=true; if(this.aiUpdateTimer>this.aiUpdateInterval*0.5)this.state='chasing';} targetX += dx * dtFactor; targetY += dy * dtFactor; this.x=targetX; this.y=targetY; // Apply movement before state update clamps Y
    this.updateState(deltaTime);} tryAttack(player,deltaTime){/*...*/ if(!this.isAttacking&&Date.now()-this.lastAttackTime>this.attackCooldown){this.isAttacking=true;this.attackType='punch';this.attackTimer=punchDuration;this.lastAttackTime=Date.now();this.isWalking=false; const delay=this.attackTimer*0.4; setTimeout(()=>{if(!gameRunning||!this.isAttacking||this.attackType!=='punch'||this.isHit||this.isKnockedDown||this.isFalling||this.isDead)return; const aXC=this.x+this.width/2+(this.facingRight?this.width/4:-this.width/4); const aHX=this.facingRight?aXC:aXC-enemyAttackRange; const aHW=enemyAttackRange; const aHY=this.y+this.height*0.3; const aHH=this.height*0.4; if(!player.isHit&&!player.isKnockedDown&&!player.isFalling&&!player.isDead){if(aHX<player.x+player.width&&aHX+aHW>player.x&&aHY<player.y+player.height&&aHY+aHH>player.y){const eCX=this.x+this.width/2; const pCX=player.x+player.width/2; const hOCS=(this.facingRight&&pCX>eCX-this.width*0.1)||(!this.facingRight&&pCX<eCX+this.width*0.1); if(hOCS){player.takeDamage(this.attackDamage,this,'enemyPunch');}}}},delay);}}}
class GruntEnemy extends Enemy{constructor(x,y){super(x,y,42,80,'#d2b48c',80,1.0,1.0,1.1);this.shirtColor=choose(gruntShirtColors);this.pantsColor=choose(gruntPantsColors);this.skinColor=this.baseColor;this.hairStyle=choose(hairStyles);this.hairColor=choose(hairColors);}}
class FastEnemy extends Enemy{constructor(x,y){super(x,y,38,75,'#c8a078',55,1.4,0.8,0.85);this.shirtColor=choose(fastShirtColors);this.pantsColor=choose(fastPantsColors);this.skinColor=this.baseColor;this.hairStyle=choose(hairStyles);this.hairColor=choose(hairColors);}}
class FemaleEnemy extends Enemy{constructor(x,y){super(x,y,40,88,'#f5deb3',75,1.2,0.9,1.0);this.shirtColor=choose(femaleTopColors);this.pantsColor=choose(femaleBottomColors);this.skinColor=this.baseColor;this.hairStyle=choose(['short','slick','braid','dreads']);this.hairColor=choose(hairColors);} tryAttack(player,deltaTime){if(!this.isAttacking&&Date.now()-this.lastAttackTime>this.attackCooldown){const attackChoice=(Math.random()<0.5)?'kick':'punch';this.isAttacking=true;this.attackType=attackChoice;this.attackTimer=(attackChoice==='kick'?kickDuration*0.9:punchDuration);this.lastAttackTime=Date.now();this.isWalking=false; const delay=this.attackTimer*(attackChoice==='kick'?0.5:0.4); const range=(attackChoice==='kick'?kickRange*0.8:enemyAttackRange); const attY=this.y+this.height*(attackChoice==='kick'?0.5:0.3); const attH=this.height*0.4; setTimeout(()=>{if(!gameRunning||!this.isAttacking||this.attackType!==attackChoice||this.isHit||this.isKnockedDown||this.isFalling||this.isDead)return; const aXC=this.x+this.width/2+(this.facingRight?this.width/4:-this.width/4); const aHX=this.facingRight?aXC:aXC-range; const aHW=range; const aHY=attY; const aHH=attH; if(!player.isHit&&!player.isKnockedDown&&!player.isFalling&&!player.isDead){if(aHX<player.x+player.width&&aHX+aHW>player.x&&aHY<player.y+player.height&&aHY+aHH>player.y){const eCX=this.x+this.width/2;const pCX=player.x+player.width/2; const hOCS=(this.facingRight&&pCX>eCX-this.width*0.1)||(!this.facingRight&&pCX<eCX+this.width*0.1); if(hOCS){player.takeDamage(this.attackDamage*(attackChoice==='kick'?1.2:1.0),this,`enemy${attackChoice}`);}}}},delay);}}}
class GrabberEnemy extends Enemy{constructor(x,y){super(x,y,44,82,'#a08070',65,1.1,0.6,1.3);this.shirtColor='#8B0000';this.pantsColor='#1a1a1a';this.skinColor=this.baseColor;this.hairStyle='bald';this.hairColor='#000';this.isGrabbingPlayer=false;this.grabCooldown=0;} update(player,deltaTime){if(this.isGrabbingPlayer&&!player.isGrabbedBehind){this.isGrabbingPlayer=false;} if(this.isDead||this.hp<=0||this.isFalling){if(this.isGrabbingPlayer){player.isGrabbedBehind=false;player.grabbedBehindBy=null;this.isGrabbingPlayer=false;} this.updateState(deltaTime);return;} if(this.grabCooldown>0){this.grabCooldown-=deltaTime;} if(this.isGrabbingPlayer){this.x=player.x+player.width-this.width*0.3; this.y=player.y; this.facingRight=player.facingRight; this.updateState(deltaTime);return;} if(this.isGrabbed||this.isKnockedDown||this.isHit){this.updateState(deltaTime);return;} if(this.state==='exitingDoor'||this.state==='exitingWindow'){super.update(player,deltaTime);return;} this.aiUpdateTimer+=deltaTime; let dx=0,dy=0;this.isWalking=false; const dtFactor=deltaTime/16.67; const pX=player.x,pY=player.y; const dX=pX-this.x,dY=pY-this.y; const distSq=dX*dX+dY*dY; const idealY=clamp(pY+this.targetYOffset,platformTop,platformBottom-this.height); this.yDiff=idealY-this.y; if(!player.isFalling&&!player.isKnockedDown&&!player.isDead&&!player.isGrabbedBehind&&this.grabCooldown<=0){this.facingRight=dX>0; if(distSq<grabRange*grabRange*3){const behindPlayer=(player.facingRight&&dX<0)||(!player.facingRight&&dX>0); if(behindPlayer&&Math.abs(dY)<30){this.tryGrab(player);}} if(distSq>grabRange*grabRange*6){this.state='chasing';}} if(this.state==='chasing'){dx=Math.sign(player.x-this.x)*this.speed; if(Math.abs(this.yDiff)>5){dy=Math.sign(this.yDiff)*this.speed*0.7;} this.isWalking=true;} this.x+=dx*dtFactor; this.y+=dy*dtFactor; this.updateState(deltaTime);} tryGrab(player){if(this.isGrabbingPlayer||player.isGrabbedBehind)return; this.isGrabbingPlayer=true; player.isGrabbedBehind=true; player.grabbedBehindBy=this; this.isWalking=false; console.log("GrabberEnemy: GRABBED player from behind!");}}
class BossEnemy extends Enemy{constructor(x,y){super(x,y,75,115,'#b8860b',450,0.75,1.9,1.6);this.shirtColor='#600';this.pantsColor='#222';this.skinColor=this.baseColor;this.hairStyle='bald';this.hairColor='#000';this.knockdownResilience=0;this.isWakingUp=false;this.wakeupAttackTimer=0;this.wakeupAttackDuration=1000;this.wakeupAttackHitTime=700;this.wakeupDamage=35;this.hasPerformedWakeupAttack=false;} update(player,deltaTime){if(this.isDead||this.hp<=0){this.updateState(deltaTime);return;} if(this.state==='exitingWindow'){const dx=this.exitWindowTargetX-this.x; const dy=this.exitWindowTargetY-this.y; const dist=Math.sqrt(dx*dx+dy*dy); if(dist>this.speed*2.0){const angle=Math.atan2(dy,dx); this.vx=Math.cos(angle)*this.speed*1.8; this.vy=Math.sin(angle)*this.speed*1.2; this.isWalking=true;}else{this.vx=0;this.vy=0; this.x=this.exitWindowTargetX; this.y=this.exitWindowTargetY; this.state='chasing'; this.isWalking=false; this.isOnPlatform=true;} this.updateState(deltaTime);return;} if(this.isWakingUp){const elapsed=Date.now()-this.wakeupAttackTimer; if(!this.hasPerformedWakeupAttack&&elapsed>=this.wakeupAttackHitTime){this.performWakeupAttack(player);this.hasPerformedWakeupAttack=true;} if(elapsed>this.wakeupAttackDuration){this.isWakingUp=false;this.hasPerformedWakeupAttack=false;this.attackCooldownTimer=500;} this.updateState(deltaTime);return;} super.update(player,deltaTime); if(this.isKnockedDown&&!this.isWakingUp&&(Date.now()-this.knockdownTimer>=knockdownTime)){this.isKnockedDown=false;this.y=clamp(this.y,platformTop,platformBottom-this.height);this.hp=Math.max(this.hp,1); if(this.hp>0){this.isWakingUp=true;this.wakeupAttackTimer=Date.now();this.hasPerformedWakeupAttack=false;this.knockdownResilience=0;console.log("BOSS: Waking up!");}}} performWakeupAttack(player){console.log("BOSS: Wakeup Attack!");createBlood(this.x+this.width/2,this.y+this.height/2,30); const attackRadiusSq=(this.width*1.6)**2; const pCX=player.x+player.width/2,pCY=player.y+player.height/2; const bCX=this.x+this.width/2,bCY=this.y+this.height/2; const dx=pCX-bCX,dy=pCY-bCY; const distSq=dx*dx+dy*dy; if(distSq<attackRadiusSq){if(!player.isHit&&!player.isKnockedDown&&!player.isFalling&&!player.isDead){player.takeDamage(this.wakeupDamage,this,'bossWakeup'); const angle=Math.atan2(dy,dx); player.vx=Math.cos(angle)*18; player.vy=-10; console.log("Player hit by wakeup!");}}}}

let player = new Player(150, platformBottom - 85); let enemies = []; let lastTime = 0; const enemySpawnInterval = 2800; let enemySpawnTimer = 800; let globalNow = Date.now();
const trainWindowPositions = [295, 695, 1095]; // Example X centers of windows

function drawBackground(){const skyGradient=ctx.createLinearGradient(0,0,0,platformTop+100); skyGradient.addColorStop(0,'#1f1f38'); skyGradient.addColorStop(0.8,'#454568'); skyGradient.addColorStop(1,'#555578'); ctx.fillStyle=skyGradient; ctx.fillRect(0,0,canvas.width,platformTop); ctx.fillStyle='#4a4a52'; ctx.fillRect(0,0,canvas.width,platformTop); ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=1; for(let y=0;y<platformTop;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();} for(let x=0;x<canvas.width;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,platformTop);ctx.stroke();} ctx.fillStyle='#5c5c64'; const pillarWidth=60; const pillarSpacing=300; for(let x=pillarSpacing/2;x<canvas.width;x+=pillarSpacing){ctx.fillRect(x-pillarWidth/2,0,pillarWidth,platformTop);}
    const trainY=platformTop-220; const trainHeight=200; const trainColor='#757585'; const darkTrainColor=tinycolor(trainColor)?.darken(18)?.toString()||'#444'; const lightTrainColor=tinycolor(trainColor)?.lighten(12)?.toString()||'#888'; const windowColor='#353548'; const windowWidth=55; const windowHeight=70; const windowSpacing=30; const doorWidth=70; const trainEndX=canvas.width+100; ctx.fillStyle=trainColor; ctx.fillRect(-10,trainY,trainEndX+10,trainHeight); ctx.fillStyle=darkTrainColor; ctx.fillRect(-10,trainY,trainEndX+10,25); const roofGrad=ctx.createLinearGradient(0,trainY+25,0,trainY+50); roofGrad.addColorStop(0,darkTrainColor); roofGrad.addColorStop(1,trainColor); ctx.fillStyle=roofGrad; ctx.fillRect(-10,trainY+25,trainEndX+10,25); ctx.fillStyle=darkTrainColor; ctx.fillRect(-10,trainY+trainHeight-20,trainEndX+10,20); ctx.strokeStyle=darkTrainColor; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-10,trainY+trainHeight*0.6); ctx.lineTo(trainEndX+10,trainY+trainHeight*0.6); ctx.stroke();
    ctx.fillStyle=windowColor; const windowTopY=trainY+60; let currentX=40; const doorPositions=[200, 600, 1000]; // Added a third door position
    while(currentX<trainEndX-windowWidth){let isDoor=doorPositions.some(doorX=>currentX>doorX&&currentX<doorX+doorWidth+windowSpacing); if(isDoor){ctx.fillStyle='#1a1a20'; ctx.fillRect(currentX,trainY+10,doorWidth,trainHeight-20); ctx.strokeStyle=darkTrainColor; ctx.lineWidth=2; ctx.strokeRect(currentX,trainY+10,doorWidth,trainHeight-20); currentX+=doorWidth+windowSpacing;}else{ctx.fillRect(currentX,windowTopY,windowWidth,windowHeight); ctx.fillStyle='rgba(210,210,230,0.08)'; ctx.beginPath(); ctx.moveTo(currentX+7,windowTopY+7); ctx.lineTo(currentX+windowWidth-7,windowTopY+7); ctx.lineTo(currentX+7,windowTopY+windowHeight-7); ctx.closePath(); ctx.fill(); ctx.fillStyle=windowColor;
        // Draw Boss Silhouette in MIDDLE window
        const middleWindowCenterX = trainWindowPositions[1]; // Center X of the middle window area
        if (!bossSpawned && enemiesSpawnedCount >= totalEnemiesBeforeBoss && currentX < middleWindowCenterX + windowWidth/2 && currentX + windowWidth > middleWindowCenterX - windowWidth/2) {
             const bossSilhouetteW=75*0.8; const bossSilhouetteH=115*0.8;
             ctx.fillStyle = 'rgba(40, 0, 0, 0.6)'; // Darker silhouette
             ctx.fillRect(currentX+(windowWidth-bossSilhouetteW)/2, windowTopY+(windowHeight-bossSilhouetteH)/2, bossSilhouetteW, bossSilhouetteH);
        }
        currentX+=windowWidth+windowSpacing;}}
    ctx.fillStyle='#222'; const wheelY=trainY+trainHeight-5; const wheelH=15; const wheelW=40; const bogieW=100; for(let x=80;x<trainEndX;x+=250){ctx.fillRect(x,wheelY,bogieW,wheelH); ctx.fillRect(x+wheelW/2,wheelY,wheelW,wheelH); ctx.fillRect(x+bogieW-wheelW*1.5,wheelY,wheelW,wheelH);} const cabinWidth=90; const cabinX=platformEdgeX+15; ctx.fillStyle=lightTrainColor; ctx.fillRect(cabinX,trainY,cabinWidth,trainHeight); ctx.fillStyle='#181825'; ctx.fillRect(cabinX+15,trainY+30,cabinWidth-30,80); ctx.fillStyle='#ffffdd'; ctx.beginPath(); ctx.roundRect(cabinX+18,trainY+trainHeight-55,25,18,[8]); ctx.fill(); ctx.beginPath(); ctx.roundRect(cabinX+cabinWidth-43,trainY+trainHeight-55,25,18,[8]); ctx.fill(); ctx.strokeStyle=darkTrainColor; ctx.lineWidth=4; ctx.strokeRect(cabinX,trainY,cabinWidth,trainHeight); ctx.fillStyle='#252535'; ctx.fillRect(cabinX-20,trainY+30,20,80); ctx.strokeRect(cabinX-20,trainY+30,20,80);
    ctx.fillStyle='#685850'; ctx.fillRect(0,platformTop,canvas.width,platformDepth); ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=1; for(let y=platformTop;y<platformBottom;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(platformEdgeX,y);ctx.stroke();} for(let x=0;x<platformEdgeX;x+=60){ctx.beginPath();ctx.moveTo(x,platformTop);ctx.lineTo(x,platformBottom);ctx.stroke();}
    const railY=platformBottom+25; const tieY=platformBottom+20; const tieHeight=25; const tieWidth=130; const tieSpacing=50; const railColor='#555'; const tieColor='#68483f'; ctx.fillStyle=tieColor; for(let x=-tieSpacing;x<canvas.width+tieWidth;x+=tieWidth+tieSpacing){ctx.fillRect(x,tieY,tieWidth,tieHeight);} ctx.fillStyle=railColor; ctx.fillRect(0,railY,canvas.width,10); ctx.fillRect(0,railY+tieHeight*0.6,canvas.width,10);
    const platformFrontHeight=canvas.height-platformBottom; const frontGradient=ctx.createLinearGradient(0,platformBottom,0,canvas.height); frontGradient.addColorStop(0,'#58483e'); frontGradient.addColorStop(1,'#382a20'); ctx.fillStyle=frontGradient; ctx.fillRect(0,platformBottom,canvas.width,platformFrontHeight); ctx.fillStyle='#303030'; ctx.fillRect(platformEdgeX,platformTop-10,15,platformBottom-platformTop+25); ctx.fillStyle='#ffdd44'; for(let yStripe=platformTop;yStripe<platformBottom;yStripe+=25){ctx.fillRect(platformEdgeX+3,yStripe,9,12);}
    const canW=40; const canH=60; const canX1=50; const canY=platformBottom-canH; const canX2=platformEdgeX-canW-40; ctx.fillStyle='#3a3a3a'; ctx.fillRect(canX1,canY,canW,canH); ctx.fillRect(canX2,canY,canW,canH); ctx.fillStyle='#2a2a2a'; ctx.fillRect(canX1,canY,canW,10); ctx.fillRect(canX2,canY,canW,10); ctx.fillStyle='#555'; ctx.fillRect(canX1+canW*0.1,canY+20,canW*0.8,5); ctx.fillRect(canX2+canW*0.1,canY+20,canW*0.8,5);
}

function gameLoop(timestamp){if(!lastTime){lastTime=timestamp;} const deltaTime=timestamp-lastTime; lastTime=timestamp; globalNow=Date.now(); if(!gameRunning){return;} if(deltaTime>100){requestAnimationFrame(gameLoop); return;} update(deltaTime); draw(); requestAnimationFrame(gameLoop);}
function update(deltaTime){player.update(enemies,deltaTime); enemySpawnTimer-=deltaTime; if(!bossSpawned&&enemiesSpawnedCount<totalEnemiesToSpawn&&enemies.length<maxEnemiesOnScreen&&enemySpawnTimer<=0){spawnEnemy(); enemySpawnTimer=enemySpawnInterval*(0.85+Math.random()*0.3);} if(!bossSpawned&&enemiesSpawnedCount>=totalEnemiesBeforeBoss&&enemies.filter(e=>e&&!e.isDead&&!(e instanceof BossEnemy)).length===0){spawnBoss(); /* bossSpawned set inside spawnBoss */} enemies.forEach((enemy,index)=>{if(!enemy)return; enemy.update(player,deltaTime); if(enemy.isDead&&enemy.deadTimer>corpseLingerTime){enemies[index]=null; console.log("Removing corpse");}else if(enemy.hp<=0&&!enemy.isDead){enemy.isDead=true; enemy.deadTimer=0;}}); enemies=enemies.filter(e=>e!==null); allEnemiesCleared=enemies.filter(e=>!e.isDead).length===0&&enemiesSpawnedCount>=totalEnemiesToSpawn; if(bossDefeated&&allEnemiesCleared&&gameRunning){levelComplete();}}
function spawnEnemy(){let spawnX,spawnY,isDoorSpawn=false; const doorSpawnX=200+35; const doorExitX=doorSpawnX+50; spawnY=platformTop+platformDepth*0.33+Math.random()*(platformDepth*0.34); if(Math.random()<0.25){spawnX=doorSpawnX-20; isDoorSpawn=true;}else{spawnX=Math.random()<0.5?-100:canvas.width+100;} let newEnemy; const enemyType=getRandomInt(1,4); switch(enemyType){case 1:newEnemy=new GruntEnemy(spawnX,spawnY);break; case 2:newEnemy=new FastEnemy(spawnX,spawnY);break; case 3:newEnemy=new FemaleEnemy(spawnX,spawnY);break; case 4:newEnemy=new GrabberEnemy(spawnX,spawnY);break; default:newEnemy=new GruntEnemy(spawnX,spawnY);} if(isDoorSpawn){newEnemy.state='exitingDoor'; newEnemy.exitDoorTargetX=doorExitX; newEnemy.facingRight=true;}else{const dx=newEnemy.x-player.x, dy=newEnemy.y-player.y; if(dx*dx+dy*dy<150*150){newEnemy.x=-spawnX;}} enemies.push(newEnemy); enemiesSpawnedCount++; console.log(`Spawned enemy #${enemiesSpawnedCount}/${totalEnemiesToSpawn}. Type: ${newEnemy.constructor.name}. Door: ${isDoorSpawn}. Alive: ${enemies.filter(e=>!e.isDead).length}`);}
function spawnBoss(){if(bossSpawned) return; console.log(`--- Spawning Boss! (${enemiesSpawnedCount}/${totalEnemiesToSpawn}) ---`); const bossW=75; const windowX=trainWindowPositions[1]; const windowY=platformTop-220+60; const spawnX=windowX-bossW/2; const spawnY=windowY+10; const targetY=platformTop+platformDepth*0.5; const boss=new BossEnemy(spawnX,spawnY); boss.state='exitingWindow'; boss.exitWindowTargetX=windowX+20; boss.exitWindowTargetY=targetY; boss.isOnPlatform=false; enemies.push(boss); bossSpawned=true;}
function draw(){ctx.clearRect(0,0,canvas.width,canvas.height); drawBackground(); const currentDelta=lastTime?(performance.now()-lastTime):16.67; updateAndDrawParticles(currentDelta); const drawOrder=[player,...enemies.filter(e=>e)].sort((a,b)=>(a.y+(a.isDead?a.height*0.5:a.height))-(b.y+(b.isDead?b.height*0.5:b.height))); drawOrder.forEach(char=>{if(char){char.draw();}}); }
function loseLife(){lives--; playerLivesElement.textContent=lives; if(lives<=0){gameOver('No lives left!');}else{console.log(`Lost a life! Lives remaining: ${lives}`); player.hp=player.maxHp; player.isDead=false; player.x=150; player.y=platformBottom-85; player.vx=0; player.vy=0; player.isHit=false; player.isKnockedDown=false; player.isFalling=false; player.isOnPlatform=true; playerLivesElement.textContent=lives; playerHpElement.textContent=Math.ceil(player.hp);}}
function gameOver(reason="Defeated!"){if(!gameRunning)return; console.log("Game Over:",reason); gameRunning=false; const reasonEl=gameOverElement.querySelector('small')||document.createElement('small'); reasonEl.textContent=reason; gameOverElement.innerHTML=`GAME OVER<br>Lives: ${lives}<br><button onclick="location.reload()">Начать заново</button>`; gameOverElement.insertBefore(reasonEl,gameOverElement.querySelector('button')); gameOverElement.style.display='block';}
function levelComplete(){if(!gameRunning)return; console.log("--- Level Complete! ---"); gameRunning=false; document.getElementById('final-score').textContent=score; levelCompleteElement.style.display='block'; for(let i=0;i<70;i++){setTimeout(()=>{if(levelCompleteElement.style.display==='block'){particles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height*0.6,size:getRandomInt(8,20),color:`hsl(${getRandomInt(0,360)},100%,${getRandomInt(65,85)}%)`,vx:(Math.random()-0.5)*6,vy:(Math.random()-0.5)*6+1.5,life:getRandomInt(90,160),maxLife:160,isBlood:false});}},Math.random()*2500);} function celebrationLoop(ts){if(levelCompleteElement.style.display!=='block')return; const celDelta=ts-(celebrationLoop.lastTime||ts); celebrationLoop.lastTime=ts; if(celDelta>100){requestAnimationFrame(celebrationLoop); return;} drawBackground(); updateAndDrawParticles(celDelta); const drawOrder=[player,...enemies.filter(e=>e)].sort((a,b)=>(a.y+(a.isDead?a.height*0.5:a.height))-(b.y+(b.isDead?b.height*0.5:b.height))); drawOrder.forEach(char=>{if(char)char.draw();}); requestAnimationFrame(celebrationLoop);} celebrationLoop.lastTime=performance.now(); requestAnimationFrame(celebrationLoop);}

window.onload = () => { lastTime = performance.now(); requestAnimationFrame(gameLoop); };