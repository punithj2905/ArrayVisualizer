let arr=[];
let delay=200;
let paused=false;
let pauseResolvers=[];  
let comparisonMode=false;


const msg = document.getElementById('msg');
const status = document.getElementById('status');
const visualA = document.getElementById('visualA');
const visualB = document.getElementById('visualB');

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

function pause(){
paused=true;
}

function resume(){
paused=false;
/* Release ALL waiting sorting threads */
while(pauseResolvers.length){
let r=pauseResolvers.pop();
r();
}
}

async function waitIfPaused(){
if(!paused) return;

await new Promise(resolve=>{
pauseResolvers.push(resolve);
});
}

/* ---------- Renderer ---------- */

function render(array,container,active=-1){
container.innerHTML="";
let max=Math.max(...array,1);
array.forEach((v,i)=>{
let bar=document.createElement("div");
bar.className="bar"+(i===active?" active":"");
bar.style.height=(80+v/max*160)+"px";
bar.textContent=v;
container.appendChild(bar);
});
}

/* ---------- Mode ---------- */

function toggleComparisonMode() {
    comparisonMode = !comparisonMode;

    const panelB = document.getElementById("panelB");

    if (comparisonMode) {
        panelB.style.display = "block";
        msg.textContent = "Comparison Mode Enabled";
        // Render second array if already loaded
        if (arr.length) render(arr, visualB);
    } else {
        panelB.style.display = "none";
        msg.textContent = "Comparison Mode Disabled";
        document.getElementById("infoB").innerHTML = "";
    }
}


/* ---------- Array Control ---------- */

function loadArray(){
let temp=document.getElementById("arrayInput").value.trim().split(/\s+/).map(Number);
if(!temp.length || temp.some(isNaN)) return;
arr=[...temp];

render(arr,visualA);
if(comparisonMode) render(arr,visualB);
document.getElementById("infoA").innerHTML = "";
document.getElementById("infoB").innerHTML = "";

msg.textContent="Array Loaded";
}

function randomArray(){
arr=Array.from({length:10},()=>Math.floor(Math.random()*90)+10);
document.getElementById("arrayInput").value=arr.join(" ");
document.getElementById("infoA").innerHTML = "";
document.getElementById("infoB").innerHTML = "";

loadArray();
}

/* ---------- Sorting Engine ---------- */

const engine={
bubble:bubbleSort,
selection:selectionSort,
insertion:insertionSort,
merge:mergeSort,
quick:quickSort
};

async function runSort(algo,container){
let a=[...arr];
if(engine[algo]) await engine[algo](a,container);
}

/* ---------- Algorithms ---------- */

async function bubbleSort(a,container){
for(let i=0;i<a.length;i++){
for(let j=0;j<a.length-i-1;j++){
await waitIfPaused();
if(a[j]>a[j+1]) [a[j],a[j+1]]=[a[j+1],a[j]];
render(a,container,j);
await sleep(delay);
}}
render(a,container);  // Final render
}

async function selectionSort(a,container){
for(let i=0;i<a.length;i++){
let min=i;
for(let j=i+1;j<a.length;j++){
await waitIfPaused();
if(a[j]<a[min]) min=j;
render(a,container,j);
await sleep(delay);
}
if(min!==i)[a[i],a[min]]=[a[min],a[i]];
render(a,container,i);
}
render(a,container);  // Final render
}

async function insertionSort(a,container){
for(let i=1;i<a.length;i++){
let key=a[i];let j=i-1;
while(j>=0 && a[j]>key){
await waitIfPaused();
a[j+1]=a[j];j--;
render(a,container,j+1);
await sleep(delay);
}
a[j+1]=key;
render(a,container,j+1);
}
render(a,container);  // Final render
}

async function mergeSort(a,container){
async function merge(l,m,r){
let left=a.slice(l,m+1);
let right=a.slice(m+1,r+1);
let i=0,j=0,k=l;
while(i<left.length && j<right.length){
await waitIfPaused();
if(left[i]<=right[j]) a[k++]=left[i++];
else a[k++]=right[j++];
render(a,container,k-1);
await sleep(delay);
}
while(i<left.length){
a[k++]=left[i++];
render(a,container,k-1);
await sleep(delay);
}
while(j<right.length){
a[k++]=right[j++];
render(a,container,k-1);
await sleep(delay);
}
}

async function divide(l,r){
if(l>=r) return;
let m=Math.floor((l+r)/2);
await divide(l,m);
await divide(m+1,r);
await merge(l,m,r);
}

await divide(0,a.length-1);
render(a,container);  // Final render
}

async function quickSort(a,container){
async function partition(l,r){
let pivot=a[r];let i=l-1;
for(let j=l;j<r;j++){
await waitIfPaused();
if(a[j]<pivot){i++;[a[i],a[j]]=[a[j],a[i]];}
render(a,container,j);
await sleep(delay);
}
[a[i+1],a[r]]=[a[r],a[i+1]];
return i+1;
}

async function quick(l,r){
if(l<r){let p=await partition(l,r);
await quick(l,p-1);
await quick(p+1,r);
}}

await quick(0,a.length-1);
render(a,container);  // Final render
}

/* ---------- Comparison ---------- */

async function compareAlgorithms(){
    if(!arr.length) {
        msg.textContent="Please load an array first";
        return;
    }

    let algoA=document.getElementById("algoA").value;
    let algoB=document.getElementById("algoB").value;

    if(algoA===algoB){
        msg.textContent="Choose different algorithms";
        return;
    }
    comparisonMode=true;
    document.getElementById("panelB").style.display="block";
    status.textContent="Comparison Running...";

    await Promise.all([
        runSort(algoA,visualA),
        runSort(algoB,visualB)
    ]);

    //show theory panels
    updateTheoryPanel(algoA, "infoA");
    updateTheoryPanel(algoB, "infoB");

    status.textContent="Comparison Completed";
}


/* ---------- Single Run ---------- */

async function runVisualization(){
if(!arr.length) {
    msg.textContent="Please load an array first";
    return;
}

let algo=document.getElementById("algoA").value;

comparisonMode=false;
document.getElementById("panelB").style.display="none";

if(!engine[algo]) return;

status.textContent="Sorting in progress...";
await runSort(algo,visualA);

updateTheoryPanel(algo,"infoA");

status.textContent="";
msg.textContent="Sorting Completed";
}

function updateTheoryPanel(algo,panelId){

const map={
bubble:`Bubble Sort
Time: O(n²)
Space: O(1)
─────────────
for i=0 to n-1
  for j=0 to n-i-1
    if arr[j] > arr[j+1]
      swap`,

selection:`Selection Sort
Time: O(n²)
Space: O(1)
─────────────
for i=0 to n-1
  min=i
  for j=i+1 to n
    if arr[j] < arr[min]
      min=j
  swap(arr[i],arr[min])`,

insertion:`Insertion Sort
Time: O(n²)
Space: O(1)
─────────────
for i=1 to n-1
  key=arr[i]
  shift elements > key
  insert key`,

merge:`Merge Sort
Time: O(n log n)
Space: O(n)
─────────────
divide array recursively
merge sorted halves`,

quick:`Quick Sort
Time: O(n log n) avg
Space: O(log n)
─────────────
choose pivot
partition array
recursive sorting`
};

let pseudocode=map[algo] || "";

document.getElementById(panelId).innerHTML=
`<b>${algo.toUpperCase()} SORT</b>
<pre>${pseudocode}</pre>`;
}

// Initialize with random array on load
window.onload = function() {
    randomArray();
};
