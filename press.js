const MODEL_LINES = [
  "The model is an instrument at the top of its arc. It does not invent your taste. It holds the thought you hand it and returns an image. After that, you steer.",
  "Think of it as a silent compositor with a long memory and no agenda. Nouns lock the frame. Light and distance aim it. What you omit is as loud as what you name.",
  "It has seen cloth, weather, metal, faces. It has not seen this sitting until you type it. Ordinary language is the control surface."
];

const EXAMPLE_FEEDS = [
  "Add a single figure under the window, coat dark, face turned away.",
  "Move closer. Waist-high camera. The bicycle fills the left third.",
  "Change the hour: last blue of evening, not night. Keep the yellow window.",
  "Remove modern cars and plastic signs. Leave wet stone and one lamp.",
  "Colder air. Less fog. Sharper edges on the cobbles.",
  "Same scene, printed like a 1930s gravure — soft ink, deep shadows."
];

const ordinary = document.getElementById("ordinary");
const firstForm = document.getElementById("firstForm");
const makeBtn = document.getElementById("makeBtn");
const result = document.getElementById("result");
const plateImg = document.getElementById("plateImg");
const status = document.getElementById("status");
const revise = document.getElementById("revise");
const examples = document.getElementById("examples");
const missing = document.getElementById("missing");
const different = document.getElementById("different");
const mustNot = document.getElementById("mustNot");
const freeNote = document.getElementById("freeNote");
const reviseBtn = document.getElementById("reviseBtn");
const resetBtn = document.getElementById("resetBtn");

document.getElementById("modelBlurb").textContent =
  MODEL_LINES[Math.floor(Math.random() * MODEL_LINES.length)];

EXAMPLE_FEEDS.forEach((line) => {
  const li = document.createElement("li");
  li.append(document.createTextNode(line));
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "feed";
  btn.textContent = "Use this";
  btn.addEventListener("click", () => {
    freeNote.value = freeNote.value ? `${freeNote.value.trim()} ${line}` : line;
    freeNote.focus();
  });
  li.appendChild(btn);
  examples.appendChild(li);
});

let basePrompt = "";

function compileRevision() {
  const parts = [basePrompt];
  if (missing.value.trim()) parts.push(`Add what is missing: ${missing.value.trim()}.`);
  if (different.value.trim()) parts.push(`Change this: ${different.value.trim()}.`);
  if (mustNot.value.trim()) parts.push(`Do not include: ${mustNot.value.trim()}.`);
  if (freeNote.value.trim()) parts.push(freeNote.value.trim());
  return parts.join(" ");
}

function imageUrl(prompt) {
  const seed = Date.now() % 999999;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;
}

function showImage(prompt, label) {
  status.textContent = label;
  status.classList.remove("err");
  result.classList.remove("hidden");
  revise.classList.remove("hidden");
  plateImg.removeAttribute("src");
  plateImg.onload = () => {
    status.textContent = "Mark what is missing or wrong.";
    makeBtn.disabled = false;
    reviseBtn.disabled = false;
  };
  plateImg.onerror = () => {
    status.textContent = "No image returned. Try again.";
    status.classList.add("err");
    makeBtn.disabled = false;
    reviseBtn.disabled = false;
  };
  plateImg.src = imageUrl(prompt);
}

firstForm.addEventListener("submit", (e) => {
  e.preventDefault();
  basePrompt = ordinary.value.trim();
  if (!basePrompt) return;
  makeBtn.disabled = true;
  showImage(basePrompt, "Rendering…");
});

reviseBtn.addEventListener("click", () => {
  reviseBtn.disabled = true;
  showImage(compileRevision(), "Rendering the correction…");
});

resetBtn.addEventListener("click", () => {
  result.classList.add("hidden");
  revise.classList.add("hidden");
  missing.value = "";
  different.value = "";
  mustNot.value = "";
  freeNote.value = "";
  ordinary.focus();
});
