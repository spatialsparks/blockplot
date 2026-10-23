// The files of the sketch pad: the sketch saved as one file and opened again, and the paper as
// it shows as a picture. A file of an old sketch - of one view - adds what it holds. And what
// this browser keeps as a sketch that a pad could not read is offered as a file, in the alarm.
(() => {
  const { document, setTimeout, Blob, URL, paper, sketch, legacy } = globalThis;
  const $ = (id) => document.getElementById(id);
  // What the alarm says while a text waits under the pad's key that this pad cannot read.
  const UNREAD =
    'This browser holds a sketch that this pad cannot read. It is left as it is: ' +
    'the first change made here sets it aside and does not write over it.';
  // What the button of a text that was set aside says to a pointer that rests on it.
  const SET_ASIDE =
    'A pad could not read this sketch, and set it aside in this browser, as it was kept.';

  function say(trouble) {
    sketch.trouble = trouble;
    sketch.onChange();
  }

  function download(name, blob) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
  }

  async function openFile(file) {
    let read = null;
    let old = null;
    try {
      const parsed = JSON.parse(await file.text());
      read = sketch.adopt(parsed);
      old = read ? null : legacy.file(parsed);
    } catch {
      // Not JSON: refused below, like every other file that is no sketch.
    }
    if (read) sketch.change(() => (sketch.doc = read));
    else if (old)
      sketch.change((doc) => (doc.things.push(...old.things), doc.notes.push(...old.notes)));
    else say(`"${file.name}" is not a sketch: nothing was changed.`);
  }

  /**
   * Offers what this browser keeps as a sketch and a pad could not read: in the alarm, after the
   * page's own words there, a button for each such text, which saves it as a file - byte for
   * byte as it was kept. Where one waits under the pad's key, the alarm says so first. A text
   * has the number it is set aside under, or will be, on its button and in its file's name.
   */
  function offer(alarm) {
    let found = { aside: [], waiting: null };
    try {
      found = sketch.unread();
    } catch {
      // The store cannot be asked: there is nothing to offer.
    }
    const { aside, waiting } = found;
    if (waiting !== null) alarm.append(alarm.textContent === '' ? UNREAD : ` ${UNREAD}`);
    const texts = waiting === null || aside.includes(waiting) ? aside : [...aside, waiting];
    texts.forEach((text, index) => {
      const set = index < aside.length;
      const button = Object.assign(document.createElement('button'), {
        type: 'button',
        textContent: set ? `Save sketch ${index + 1} that was set aside` : 'Save it as a file',
        title: set ? SET_ASIDE : '',
      });
      // The alarm's words are white, and a button's would be too, on its white.
      Object.assign(button.style, { color: paper.INK, marginLeft: '8px' });
      button.addEventListener('click', () => {
        const file = new Blob([text], { type: 'application/json' });
        download(`sketch-unread-${index + 1}.json`, file);
      });
      alarm.append(button);
    });
  }

  $('save').addEventListener('click', () => {
    const day = new Date().toISOString().slice(0, 10);
    const file = new Blob([JSON.stringify(sketch.doc)], { type: 'application/json' });
    download(`sketch-${day}.json`, file);
  });
  $('open').addEventListener('click', () => $('file').click());
  $('file').addEventListener('change', () => {
    const [file] = $('file').files;
    $('file').value = '';
    if (file) void openFile(file);
  });
  $('picture').addEventListener('click', () => {
    $('paper').toBlob((image) => {
      const layer = sketch.nameOf(paper.PLANE, sketch.on());
      if (image) download(`sketch-${paper.VIEW}-${layer}.png`, image);
      else say('The picture is too large for this browser: zoom out and try again.');
    });
  });
  globalThis.files = { offer };
})();
