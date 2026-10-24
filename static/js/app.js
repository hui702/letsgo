"use strict";

// ============================================================
// 可調整參數區：測試辨識效果時，優先只修改這裡。
// 重新整理網頁後設定就會生效。
// ============================================================
const CONFIG = {
  camera: {
    width: 1280,
    height: 720,
    facingMode: "user",
  },
  mediapipe: {
    modelComplexity: 1,          // 0 較快；1 較準但運算量較大
    minDetectionConfidence: 0.55, // 光線較暗時可再降到 0.5
    minTrackingConfidence: 0.5,
    leftHandOnlyCount: 2,         // 仍追蹤兩隻手，避免右手先入鏡後搶走唯一的追蹤名額
    twoHandCount: 2,
  },
  timing: {
    leftStableMs: 220,           // 左手姿勢需要維持多久才觸發
    rightStableMs: 250,
    handLostMs: 500,             // 手消失多久後停止聲音
    historyFrames: 5,            // 多數決保留最近幾幀
    majorityVotes: 3,            // 至少幾幀相同才接受
  },
  gesture: {
    fingerClassifier: "angle",  // "angle" 使用彎曲角度；"legacy" 使用舊版距離法
    fingerBendThresholdDeg: 50, // 小於 50° 視為伸直，大於等於 50° 視為捲曲
    thumbBendThresholdDeg: 50,
    fingerStraightCos: 0.42,     // 越高越要求手指完全伸直
    fingerDistanceRatio: 1.055,  // 指尖需比中間關節離手腕更遠的比例
    thumbStraightCos: 0.25,
    thumbSpreadRatio: 0.58,      // 越高越要求拇指張開
    requirePalmFacing: true,     // 左右手都只接受掌心朝向鏡頭
    palmFacingMinScore: 0.12,    // 越高越嚴格；若掌心常被拒絕可降至 0.08
    palmFacingLeftSign: 1,       // USB 相機若硬體鏡像，可改成 -1
    palmFacingRightSign: -1,     // USB 相機若硬體鏡像，可改成 1
    directionDeadZone: 0.055,    // Major / Minor 中央區
    uprightQuality: "major",     // 手指朝正上方時的和弦；設為 null 則必須明顯朝左右才發聲
    octaveSplitY: 0.50,          // 右手高低八度分界
  },
  audio: {
    masterVolume: 1.0,
    noteGain: 0.078,
    attackSeconds: 0.045,
    attackStepSeconds: 0.012,
    reverbMix: 0.40,
    impulseSeconds: 2.6,
    impulseDecay: 2.7,
    compressorThreshold: -10,
    compressorKnee: 12,
    compressorRatio: 6,
  },
};

// 也可以在瀏覽器 Console 查看目前設定。
window.GESTURE_ORGAN_CONFIG = CONFIG;
window.GESTURE_ORGAN_DEBUG = {leftAngles:null,rightAngles:null};

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const ROOT_MIDI={C:60,D:62,E:64,F:65,G:67,A:69,B:71};
const NOTE_NAMES=["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
const META={C:["食指","🌸"],D:["勝利手勢","✨"],E:["三指","🎵"],F:["四指","💛"],G:["張開手掌","🌈"],A:["ROCK 手勢","🤘"],B:["I Love You","💗"]};
const KEYS={a:"C",s:"D",d:"E",f:"F",g:"G",h:"A",j:"B"};
const LINKS=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
let lastLeftGesture=null,ac,master,compressor,dry,wet,reverb,activeChord=null,activeQuality="major",activeSignature=null,voices=[],voiceType="warm",muted=false,hands=null,tracking=false,lastTime=-1,candidate=null,candidateAt=0,lastSeen=0,transpose=0,voicingMode="root",octaveShift=0,rightCandidate=null,rightCandidateAt=0,rightControlEnabled=false,leftGestureHistory=[],activeStream=null,selectedCameraId="",detectionLoopStarted=false,activeSource=null,manualQuality="major",heldKey=null;

function initAudio(){
  if(ac){if(ac.state==="suspended")ac.resume();return}
  ac=new(window.AudioContext||window.webkitAudioContext)();master=ac.createGain();compressor=ac.createDynamicsCompressor();dry=ac.createGain();wet=ac.createGain();reverb=ac.createConvolver();reverb.buffer=impulse(CONFIG.audio.impulseSeconds,CONFIG.audio.impulseDecay);compressor.threshold.value=CONFIG.audio.compressorThreshold;compressor.knee.value=CONFIG.audio.compressorKnee;compressor.ratio.value=CONFIG.audio.compressorRatio;compressor.attack.value=.003;compressor.release.value=.22;dry.connect(master);reverb.connect(wet).connect(master);master.connect(compressor).connect(ac.destination);setVolume();setReverb();
}
function impulse(seconds,decay){const len=ac.sampleRate*seconds,b=ac.createBuffer(2,len,ac.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,decay)}return b}
function partials(){return{warm:[[.5,"sine",.12],[1,"sine",1],[2,"sine",.35],[3,"sine",.13]],sparkle:[[1,"triangle",.82],[2,"sine",.42],[3,"sine",.2],[4,"sine",.1]],grand:[[.5,"sine",.22],[1,"sawtooth",.42],[2,"sine",.4],[3,"sine",.18]]}[voiceType]}

function chordData(root,quality){const rootMidi=ROOT_MIDI[root]+transpose+octaveShift,third=quality==="minor"?3:4;let intervals=[0,third,7],suffix=quality==="minor"?"m":"";if(voicingMode==="first"){intervals=[third,7,12];suffix+=`/1st`}else if(voicingMode==="maj7"){intervals=[0,third,7,11];suffix+=quality==="minor"?"Maj7":"maj7"}else if(voicingMode==="dom7"){intervals=[0,third,7,10];suffix+=quality==="minor"?"7":"7"}const frequencies=intervals.map(n=>440*Math.pow(2,(rootMidi+n-69)/12)),label=`${NOTE_NAMES[((rootMidi%12)+12)%12]}${suffix}`;return{frequencies,label}}
function playChord(name,source="gesture",quality="major"){
  if(!ROOT_MIDI[name])return;const data=chordData(name,quality),signature=`${name}:${quality}:${transpose}:${voicingMode}:${octaveShift}`;if(activeSignature===signature&&voices.length)return;initAudio();stopChord(false);const now=ac.currentTime;
  data.frequencies.forEach((frequency,index)=>{const noteGain=ac.createGain(),filter=ac.createBiquadFilter();filter.type="lowpass";filter.frequency.value=voiceType==="sparkle"?5200:3200;noteGain.gain.setValueAtTime(.0001,now);noteGain.gain.exponentialRampToValueAtTime(CONFIG.audio.noteGain,now+CONFIG.audio.attackSeconds+index*CONFIG.audio.attackStepSeconds);noteGain.connect(filter);filter.connect(dry);filter.connect(reverb);const oscs=partials().map(([ratio,type,amount])=>{const osc=ac.createOscillator(),gain=ac.createGain();osc.type=type;osc.frequency.value=frequency*ratio;gain.gain.value=amount;osc.connect(gain).connect(noteGain);osc.start(now);return osc});voices.push({oscs,gain:noteGain})});
  activeChord=name;activeQuality=quality;activeSignature=signature;activeSource=source;updateUI(name,source,quality,data.label);celebrate(name);
}
function stopChord(update=true){if(ac){const now=ac.currentTime;voices.forEach(v=>{v.gain.gain.cancelScheduledValues(now);v.gain.gain.setTargetAtTime(.0001,now,.08);v.oscs.forEach(o=>{try{o.stop(now+.45)}catch(_){}})})}voices=[];activeChord=null;activeSignature=null;activeSource=null;if(update)updateUI(null)}
function updateUI(name,source="gesture",quality="major",label=name){$("#chordName").textContent=label||"—";$("#gestureName").textContent=name?`${source==="manual"?"手動彈奏":META[name][0]} · ${quality==="minor"?"← Minor":"Major →"}`:"等待手勢";const display=$("#chordDisplay");display.classList.remove("bounce");void display.offsetWidth;if(name)display.classList.add("bounce");$$('[data-chord]').forEach(el=>el.classList.toggle("active",el.dataset.chord===name));const steps={C:0,D:1,E:2,F:3,G:4,A:5,B:6};$$('[data-guide-step]').forEach(el=>el.classList.toggle("active",name&&Number(el.dataset.guideStep)===steps[name]));if(!name&&source==="fist")$("#gestureName").textContent="握拳 · 安靜一下"}
function celebrate(chord){const stage=$(".camera-stage");stage.classList.remove("flash");void stage.offsetWidth;stage.classList.add("flash");const symbols=[META[chord][1],"♪","♫","★","♥"];for(let i=0;i<12;i++){const p=document.createElement("span");p.className="particle";p.textContent=symbols[i%symbols.length];p.style.left=`${45+Math.random()*10}%`;p.style.top=`${43+Math.random()*12}%`;p.style.setProperty("--x",`${(Math.random()-.5)*520}px`);p.style.setProperty("--y",`${-100-Math.random()*360}px`);p.style.setProperty("--r",`${(Math.random()-.5)*400}deg`);p.style.color=["#ff719b","#ffd968","#83d9c5","#9b83e6"][i%4];$("#confettiLayer").appendChild(p);setTimeout(()=>p.remove(),2000)}}

function cameraConstraints(){const source=selectedCameraId?{deviceId:{exact:selectedCameraId}}:{facingMode:CONFIG.camera.facingMode};return{video:{width:{ideal:CONFIG.camera.width},height:{ideal:CONFIG.camera.height},...source},audio:false}}
async function refreshCameraList(){if(!navigator.mediaDevices?.enumerateDevices)return;const devices=(await navigator.mediaDevices.enumerateDevices()).filter(device=>device.kind==="videoinput"),select=$("#cameraSelect"),current=selectedCameraId||activeStream?.getVideoTracks()[0]?.getSettings().deviceId||"";select.innerHTML="";devices.forEach((device,index)=>{const option=document.createElement("option");option.value=device.deviceId;option.textContent=device.label||`攝影機 ${index+1}`;select.appendChild(option)});if(!devices.length){const option=document.createElement("option");option.value="";option.textContent="找不到攝影機";select.appendChild(option)}else{select.value=devices.some(device=>device.deviceId===current)?current:devices[0].deviceId;selectedCameraId=select.value}}
async function openCameraStream(){const nextStream=await navigator.mediaDevices.getUserMedia(cameraConstraints()),previous=activeStream;activeStream=nextStream;const video=$("#camera");video.srcObject=nextStream;await video.play();previous?.getTracks().forEach(track=>track.stop());const settings=nextStream.getVideoTracks()[0]?.getSettings();selectedCameraId=settings?.deviceId||selectedCameraId;await refreshCameraList();console.info("[Gesture Organ] Camera settings:",settings)}
async function switchCamera(deviceId){selectedCameraId=deviceId;if(!activeStream)return;const select=$("#cameraSelect");select.disabled=true;try{lastTime=-1;await openCameraStream();showToast(`已切換攝影機：${select.selectedOptions[0]?.text||"USB_CAM"} 📷`)}catch(error){showToast(`無法切換攝影機：${error.message}`);await refreshCameraList()}finally{select.disabled=false}}
async function startCamera(){const button=$("#startButton");button.disabled=true;button.querySelector("span").textContent="正在準備魔法…";try{initAudio();if(!navigator.mediaDevices?.getUserMedia)throw new Error("這個瀏覽器不支援攝影機");if(typeof Hands==="undefined")throw new Error("手勢模型沒有載入，請確認網路連線");await openCameraStream();console.info("[Gesture Organ] Tuning config:",CONFIG);if(!hands){hands=new Hands({locateFile:file=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`});hands.setOptions({maxNumHands:rightControlEnabled?CONFIG.mediapipe.twoHandCount:CONFIG.mediapipe.leftHandOnlyCount,modelComplexity:CONFIG.mediapipe.modelComplexity,minDetectionConfidence:CONFIG.mediapipe.minDetectionConfidence,minTrackingConfidence:CONFIG.mediapipe.minTrackingConfidence});hands.onResults(onResults)}tracking=true;$("#cameraPlaceholder").classList.add("hidden");$("#cameraShell").classList.add("online");$("#cameraStatus").classList.add("online");setHandStatus("正在載入手勢模型…");if(!detectionLoopStarted){detectionLoopStarted=true;requestAnimationFrame(detect)}}catch(error){button.disabled=false;button.querySelector("span").textContent="再試一次";showToast(error.name==="NotAllowedError"?"請允許攝影機權限，再按一次開啟喔！":error.message)}}
async function detect(){if(!tracking)return;const video=$("#camera");if(video.readyState>=2&&video.currentTime!==lastTime){lastTime=video.currentTime;try{await hands.send({image:video})}catch(error){console.warn("[Gesture Organ] Detection frame skipped:",error)}}requestAnimationFrame(detect)}
function onResults(results){const video=$("#camera"),canvas=$("#trackingCanvas"),ctx=canvas.getContext("2d");if(canvas.width!==video.videoWidth){canvas.width=video.videoWidth;canvas.height=video.videoHeight}ctx.clearRect(0,0,canvas.width,canvas.height);const allHands=results.multiHandLandmarks||[],handedness=results.multiHandedness||[];let leftFound=false,rightFound=false,leftBackFound=false,rightBackFound=false;let otherHandSeen=false;allHands.forEach((points,index)=>{const label=(handedness[index]?.label||"").toLowerCase(),labelRole=label?(label==="left"?"right":"left"):(points[0].x>.5?"left":"right");let role=labelRole,facing;if(!rightControlEnabled){/* 只需要一隻和弦手：以掌心方向為準，不完全相信容易誤判的左右手標籤 */if(palmFacingCamera(points,"left")){role="left";facing=true}else{facing=labelRole!=="left";if(facing)otherHandSeen=true}}else facing=palmFacingCamera(points,role);if(role==="left"&&facing&&leftFound)role="extra";drawHand(ctx,canvas,points,role==="extra"?"right":role,facing);if(role==="left"){if(!facing){leftBackFound=true;return}leftFound=true;lastSeen=Date.now();lastLeftGesture=classify(points);stabilize(smoothLeftGesture(lastLeftGesture))}else if(role==="extra"){return}else if(rightControlEnabled){if(!facing){rightBackFound=true;return}rightFound=true;stabilizeRight(classifyRight(points))}});$(".right-control-dock").classList.toggle("detecting",rightControlEnabled&&rightFound);let status;if(leftBackFound)status="請將左手掌心朝鏡頭 ✋";else if(rightControlEnabled&&rightBackFound)status="請將右手掌心朝鏡頭 ✋";else if(leftFound&&!lastLeftGesture)status="看到左手了，比出指南上的手勢 ☝️";else if(leftFound)status=rightControlEnabled&&rightFound?"雙手辨識中 ♪":"左手辨識中 ♪";else if(otherHandSeen||(rightControlEnabled&&rightFound))status="看到右手了，請舉起左手掌心 ✋";else status="把左手舉到鏡頭前 ✋";setHandStatus(status);if(!leftFound&&Date.now()-lastSeen>CONFIG.timing.handLostMs){leftGestureHistory=[];resetCandidate();if(activeSource==="gesture")stopChord()}}

function setHandStatus(text){$("#cameraStatus span").textContent=text;const hint=$("#handHint");if(hint&&hint.textContent!==text)hint.textContent=text}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function palmFacingCamera(p,role){if(!CONFIG.gesture.requirePalmFacing)return true;const wrist=p[0],index=p[5],pinky=p[17],indexVector={x:index.x-wrist.x,y:index.y-wrist.y},pinkyVector={x:pinky.x-wrist.x,y:pinky.y-wrist.y},cross=indexVector.x*pinkyVector.y-indexVector.y*pinkyVector.x,scale=Math.hypot(indexVector.x,indexVector.y)*Math.hypot(pinkyVector.x,pinkyVector.y)+1e-6,normalizedCross=cross/scale,sign=role==="left"?CONFIG.gesture.palmFacingLeftSign:CONFIG.gesture.palmFacingRightSign,score=normalizedCross*sign;return score>CONFIG.gesture.palmFacingMinScore}
function vectorAngle(v1,v2){const denominator=Math.hypot(v1.x,v1.y)*Math.hypot(v2.x,v2.y);if(denominator<1e-6)return 180;const cosine=Math.max(-1,Math.min(1,(v1.x*v2.x+v1.y*v2.y)/denominator));return Math.acos(cosine)*180/Math.PI}
function fingerBendAngles(p){const bend=(anchor,joint,distal,tip)=>vectorAngle({x:p[anchor].x-p[joint].x,y:p[anchor].y-p[joint].y},{x:p[distal].x-p[tip].x,y:p[distal].y-p[tip].y});return{thumb:bend(0,2,3,4),index:bend(0,6,7,8),middle:bend(0,10,11,12),ring:bend(0,14,15,16),pinky:bend(0,18,19,20)}}
function saveAngleDebug(role,angles){window.GESTURE_ORGAN_DEBUG[`${role}Angles`]=Object.fromEntries(Object.entries(angles).map(([finger,angle])=>[finger,Math.round(angle*10)/10]))}
function extended(p,tip,pip,angles=null){if(CONFIG.gesture.fingerClassifier==="angle"){const name={8:"index",12:"middle",16:"ring",20:"pinky"}[tip];return angles[name]<CONFIG.gesture.fingerBendThresholdDeg}const mcp={8:5,12:9,16:13,20:17}[tip],v1={x:p[pip].x-p[mcp].x,y:p[pip].y-p[mcp].y},v2={x:p[tip].x-p[pip].x,y:p[tip].y-p[pip].y},cos=(v1.x*v2.x+v1.y*v2.y)/(Math.hypot(v1.x,v1.y)*Math.hypot(v2.x,v2.y)+1e-6);return cos>CONFIG.gesture.fingerStraightCos&&distance(p[tip],p[0])>distance(p[pip],p[0])*CONFIG.gesture.fingerDistanceRatio}
function thumbExtended(p,angles=null){if(CONFIG.gesture.fingerClassifier==="angle")return angles.thumb<CONFIG.gesture.thumbBendThresholdDeg;const v1={x:p[3].x-p[2].x,y:p[3].y-p[2].y},v2={x:p[4].x-p[3].x,y:p[4].y-p[3].y},cos=(v1.x*v2.x+v1.y*v2.y)/(Math.hypot(v1.x,v1.y)*Math.hypot(v2.x,v2.y)+1e-6),palmWidth=distance(p[5],p[17]);return cos>CONFIG.gesture.thumbStraightCos&&distance(p[4],p[5])>palmWidth*CONFIG.gesture.thumbSpreadRatio}
function pointDirection(p,tips){const averageX=tips.reduce((sum,i)=>sum+p[i].x,0)/tips.length,screenDx=p[0].x-averageX;if(Math.abs(screenDx)<CONFIG.gesture.directionDeadZone)return null;return screenDx>0?"major":"minor"}
function classify(p){
  const angles=fingerBendAngles(p);saveAngleDebug("left",angles);const index=extended(p,8,6,angles),middle=extended(p,12,10,angles),ring=extended(p,16,14,angles),pinky=extended(p,20,18,angles),thumb=thumbExtended(p,angles),count=[index,middle,ring,pinky].filter(Boolean).length;
  let root=null,tips=[];
  if(!thumb&&index&&!middle&&!ring&&pinky){root="A";tips=[8,20]}
  else if(thumb&&index&&!middle&&!ring&&pinky){root="B";tips=[8,20]}
  else if(count===0&&!thumb)return"STOP";
  else if(!thumb&&index&&!middle&&!ring&&!pinky){root="C";tips=[8]}
  else if(!thumb&&index&&middle&&!ring&&!pinky){root="D";tips=[8,12]}
  else if(!thumb&&index&&middle&&ring&&!pinky){root="E";tips=[8,12,16]}
  else if(count===4&&!thumb){root="F";tips=[8,12,16,20]}
  else if(count===4&&thumb){root="G";tips=[8,12,16,20]}
  if(!root)return null;const quality=pointDirection(p,tips)||CONFIG.gesture.uprightQuality;return quality?{root,quality}:null;
}
function smoothLeftGesture(gesture){const token=gesture==="STOP"?"STOP":gesture?`${gesture.root}:${gesture.quality}`:null;leftGestureHistory.push(token);if(leftGestureHistory.length>CONFIG.timing.historyFrames)leftGestureHistory.shift();const counts={};leftGestureHistory.filter(Boolean).forEach(value=>counts[value]=(counts[value]||0)+1);const winner=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];if(!winner||winner[1]<CONFIG.timing.majorityVotes)return null;if(winner[0]==="STOP")return"STOP";const[root,quality]=winner[0].split(":");return{root,quality}}
function stabilize(gesture){if(!gesture){resetCandidate();return}const gestureKey=gesture==="STOP"?"STOP":`${gesture.root}:${gesture.quality}`,now=performance.now();if(candidate!==gestureKey){candidate=gestureKey;candidateAt=now}const progress=Math.min(1,(now-candidateAt)/CONFIG.timing.leftStableMs);$("#stabilityBar").style.width=`${progress*100}%`;if(progress<1)return;if(gesture==="STOP"){if(activeChord){stopChord(false);updateUI(null,"fist")}}else playChord(gesture.root,"gesture",gesture.quality)}
function resetCandidate(){candidate=null;candidateAt=0;$("#stabilityBar").style.width="0"}
function classifyRight(p){const angles=fingerBendAngles(p);saveAngleDebug("right",angles);const count=[[8,6],[12,10],[16,14],[20,18]].filter(([tip,pip])=>extended(p,tip,pip,angles)).length;if(count<1)return null;const modes=[null,"root","first","maj7","dom7"],octave=p[9].y<CONFIG.gesture.octaveSplitY?12:0;return{mode:modes[count],octave}}
function stabilizeRight(control){if(!control){rightCandidate=null;rightCandidateAt=0;return}const key=`${control.mode}:${control.octave}`,now=performance.now();if(rightCandidate!==key){rightCandidate=key;rightCandidateAt=now}if(now-rightCandidateAt<CONFIG.timing.rightStableMs)return;if(voicingMode===control.mode&&octaveShift===control.octave)return;voicingMode=control.mode;octaveShift=control.octave;updateRightUI();if(activeChord)playChord(activeChord,"gesture",activeQuality)}
function updateRightUI(){const dock=$(".right-control-dock"),toggle=$("#rightHandToggle");dock.classList.toggle("disabled",!rightControlEnabled);toggle.setAttribute("aria-pressed",String(rightControlEnabled));toggle.querySelector("span").textContent=rightControlEnabled?"ON":"OFF";$$('[data-right-mode]').forEach(el=>el.classList.toggle("active",el.dataset.rightMode===voicingMode));const bars=$$("#octaveMeter i"),activeBars=octaveShift===12?6:2;bars.forEach((bar,index)=>bar.classList.toggle("active",index>=bars.length-activeBars));const labels={root:"Root",first:"1st",maj7:"Maj 7",dom7:"Dom 7"};$("#rightStatus").textContent=rightControlEnabled?`${labels[voicingMode]} · ${octaveShift===12?"High":"Low"}`:"已關閉"}
function toggleRightControl(){rightControlEnabled=!rightControlEnabled;rightCandidate=null;rightCandidateAt=0;if(!rightControlEnabled){voicingMode="root";octaveShift=0}updateRightUI();if(hands)hands.setOptions({maxNumHands:rightControlEnabled?CONFIG.mediapipe.twoHandCount:CONFIG.mediapipe.leftHandOnlyCount});if(activeChord)playChord(activeChord,"gesture",activeQuality);showToast(rightControlEnabled?"右手控制已開啟 ✋":"右手控制已關閉，保留左手和弦 👈")}
function drawHand(ctx,canvas,p,role="left",facing=true){ctx.lineCap="round";ctx.strokeStyle=!facing?"rgba(255,125,105,.9)":role==="right"?"rgba(170,210,255,.9)":"rgba(255,210,225,.9)";ctx.lineWidth=4;LINKS.forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(p[a].x*canvas.width,p[a].y*canvas.height);ctx.lineTo(p[b].x*canvas.width,p[b].y*canvas.height);ctx.stroke()});p.forEach((point,i)=>{ctx.beginPath();ctx.arc(point.x*canvas.width,point.y*canvas.height,i%4===0?7:4,0,Math.PI*2);ctx.fillStyle=!facing?"#ff765f":role==="right"?(i%4===0?"#ffd968":"#64aaff"):(i%4===0?"#ffd968":"#ff719b");ctx.fill()})}

function updateKeyUI(){const keyValue=$("#keyValue");if(keyValue)keyValue.textContent=`${NOTE_NAMES[transpose]} Key`;$("#keySelect").value=String(transpose);$$('[data-chord]').forEach(el=>{const label=NOTE_NAMES[(ROOT_MIDI[el.dataset.chord]+transpose)%12],target=el.matches("button")?el.querySelector("span"):el.querySelector("strong");if(target)target.textContent=label});const scale=[0,2,4,5,7,9,11];$$('[data-guide-step]').forEach(row=>row.querySelector("span").textContent=NOTE_NAMES[(transpose+scale[Number(row.dataset.guideStep)])%12])}
function raiseKey(){transpose=(transpose+1)%12;stopChord();resetCandidate();updateKeyUI();showToast(transpose===0?"繞了一圈，回到原調囉！ 🎹":`所有和弦升高 ${transpose} 個半音 ♯`)}
function selectKey(value){transpose=Number(value);stopChord();resetCandidate();updateKeyUI();showToast(`已切換到 ${NOTE_NAMES[transpose]} Key 🎹`)}
function toggleGuide(){const guide=$("#leftHandGuide"),button=$("#guideToggle"),closed=guide.classList.toggle("closed");button.textContent=closed?"Show Guide":"Close Guide";button.setAttribute("aria-expanded",String(!closed))}
function updateFullscreenUI(active){document.body.classList.toggle("performance-mode",active);const button=$("#fullscreenButton");button.setAttribute("aria-pressed",String(active));button.querySelector("i").className=active?"bi bi-fullscreen-exit":"bi bi-arrows-fullscreen";button.querySelector("span").textContent=active?"離開全螢幕":"全螢幕演奏"}
async function toggleFullscreen(){const active=document.body.classList.contains("performance-mode");if(active){if(document.fullscreenElement)await document.exitFullscreen();else updateFullscreenUI(false);return}updateFullscreenUI(true);try{if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen()}catch(_){showToast("已切換沉浸模式；瀏覽器未允許真正全螢幕")}}

function setVolume(){if(master){const control=$("#volume"),value=control?Number(control.value)/100:CONFIG.audio.masterVolume;master.gain.setTargetAtTime(muted?0:value,ac.currentTime,.03)}}function setReverb(){if(wet){const control=$("#reverb"),n=control?Number(control.value)/100:CONFIG.audio.reverbMix;wet.gain.value=n*.7;dry.gain.value=1-n*.2}}function showToast(message){const t=$("#toast");t.textContent=message;t.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove("show"),3300)}
$("#startButton").addEventListener("click",startCamera);$("#fullscreenButton").addEventListener("click",toggleFullscreen);$("#keyUpButton")?.addEventListener("click",raiseKey);$("#rightHandToggle").addEventListener("click",toggleRightControl);$("#keySelect").addEventListener("change",e=>selectKey(e.target.value));$("#cameraSelect").addEventListener("change",e=>switchCamera(e.target.value));$("#synthSelect").addEventListener("change",e=>{voiceType=e.target.value;stopChord();showToast(`音色已切換：${e.target.selectedOptions[0].text}`)});$("#guideToggle").addEventListener("click",toggleGuide);$("#soundToggle").addEventListener("click",()=>{muted=!muted;setVolume();const b=$("#soundToggle");b.classList.toggle("muted",muted);b.setAttribute("aria-pressed",String(!muted));b.querySelector("i").className=muted?"bi bi-volume-mute-fill":"bi bi-volume-up-fill";b.querySelector("span").textContent=muted?"聲音關閉":"聲音開啟"});[["volume","volumeValue",setVolume],["reverb","reverbValue",setReverb]].forEach(([id,out,fn])=>{const input=$("#"+id);if(input)input.addEventListener("input",e=>{$("#"+out).value=`${e.target.value}%`;fn()})});$$('#chordButtons button').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(_){}playChord(b.dataset.chord,"manual",manualQuality)});const release=()=>{if(activeSource==="manual"&&activeChord===b.dataset.chord)stopChord()};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('contextmenu',e=>e.preventDefault())});
$("#qualityToggle").addEventListener("click",()=>{manualQuality=manualQuality==="major"?"minor":"major";const t=$("#qualityToggle");t.setAttribute("aria-pressed",String(manualQuality==="minor"));t.querySelector("span").textContent=manualQuality==="minor"?"Minor":"Major"});
const isTyping=e=>e.target.closest?.("input,select,textarea,[contenteditable]");
window.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.body.classList.contains("performance-mode")&&!document.fullscreenElement){updateFullscreenUI(false);return}const key=e.key.toLowerCase(),chord=KEYS[key];if(!chord||e.repeat||e.ctrlKey||e.metaKey||e.altKey||isTyping(e))return;heldKey=key;playChord(chord,"manual",e.shiftKey?"minor":manualQuality)});window.addEventListener("keyup",e=>{if(heldKey&&e.key.toLowerCase()===heldKey){heldKey=null;if(activeSource==="manual")stopChord()}});
const releaseManual=()=>{heldKey=null;if(activeSource==="manual")stopChord()};window.addEventListener("blur",releaseManual);document.addEventListener("visibilitychange",()=>{if(document.hidden){releaseManual();resetCandidate();if(activeChord)stopChord()}});
document.addEventListener("fullscreenchange",()=>{if(!document.fullscreenElement)updateFullscreenUI(false)});window.addEventListener("beforeunload",()=>activeStream?.getTracks().forEach(track=>track.stop()));updateKeyUI();updateRightUI();
