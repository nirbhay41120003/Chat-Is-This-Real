export const RESULT_SHAPE = `{"topic":string,"blocks":[{"type":"card","id":string,"question":string,"answer":string,"difficulty":"easy"|"medium"|"hard"}|{"type":"chart","id":string,"title":string,"labels":string[],"values":number[]}|{"type":"checklist","id":string,"title":string,"items":string[]}]`;

export function buildMessages(input, existing = null, refinement = '') {
  const system = `You create structured study materials from user notes. The exact JSON shape below is the ONLY acceptable output:
${RESULT_SHAPE}
Return ONLY valid JSON. No markdown code fences, no prose, no explanation before or after.
Create 5–10 card blocks and optionally one chart or checklist when appropriate. Each block needs a unique id. Cards must have a mix of difficulty levels. Charts use matching labels and numeric values; checklists contain concise strings.
Example: {"topic":"Photosynthesis","blocks":[{"type":"card","id":"p1","question":"Where does photosynthesis occur?","answer":"In chloroplasts.","difficulty":"easy"},{"type":"card","id":"p2","question":"What pigment captures light?","answer":"Chlorophyll.","difficulty":"easy"},{"type":"card","id":"p3","question":"What gas enters the leaf?","answer":"Carbon dioxide.","difficulty":"medium"},{"type":"card","id":"p4","question":"What sugar is produced?","answer":"Glucose.","difficulty":"medium"},{"type":"card","id":"p5","question":"What is released as a byproduct?","answer":"Oxygen.","difficulty":"hard"},{"type":"checklist","id":"c1","title":"Review","items":["Light is absorbed","Glucose is produced"]}]}`;
  const user = existing
    ? `Revise this existing study material according to the user's follow-up. Preserve correct content and edit only what is requested.\nCURRENT RESULT:\n${JSON.stringify(existing)}\nFOLLOW-UP:\n${refinement}`
    : `Create study material from these notes or topic:\n\n${input}`;
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}
