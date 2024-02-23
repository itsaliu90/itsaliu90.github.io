let initialProgression = [["C4", "E4", "G4", "B4"], ["A3", "C4", "E4", "G4"], ["D4", "F4", "A4", "C5"], ["G3", "B3", "D4", "F4"]]

let currentProgression = initialProgression; // Assume initialProgression is defined
let chordsSequence;

function createKick() {
  let kick = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 10,
    oscillator: {
      type: 'sine'
    },
    envelope: {
      attack: 0.001,
      decay: 0.4,
      sustain: 0,
      release: 0.1,
      attackCurve: 'exponential'
    },
  }).toDestination();
  return kick;
}

function createSnare() {
  let snare = new Tone.NoiseSynth({
    noise: {
      type: 'white',
      playbackRate: 3,
    },
    envelope: {
      attack: 0.001,
      decay: 0.2,
      sustain: 0,
      release: 0.1,
    },
  }).toDestination();
  return snare;
}

function createHiHat() {
  let hiHat = new Tone.MetalSynth({
    frequency: 200,
    envelope: {
      attack: 0.001,
      decay: 0.1,
      release: 0.1,
    },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
  }).toDestination();
  return hiHat;
}

// Initialize drum sounds
let kick = createKick();
let snare = createSnare();
let hiHat = createHiHat();

// Create a basic loop
let index = 0;
Tone.Transport.scheduleRepeat(time => {
  let step = index % 4;
  if (step === 0 || step === 2) {
    kick.triggerAttackRelease('C1', '8n', time);
  }
  if (step === 2) {
    snare.triggerAttackRelease('16n', time);
  }
  if (step !== 2) { // Hi-hat on steps other than where the snare hits
    hiHat.triggerAttackRelease('32n', time);
  }
  index++;
}, "8n");

const bassSynth = new Tone.MonoSynth({
  oscillator: {
    type: "sine"
  },
  envelope: {
    attack: 0.1,
    decay: 0.3,
    sustain: 0.4,
    release: 2,
  },
}).toDestination();

const bassPart = new Tone.Sequence((time, note) => {
  bassSynth.triggerAttackRelease(note, "16n", time);
}, ["C2", "E2", "G2", "A2"], "4n").start(0);

const chordSynth = new Tone.PolySynth(Tone.Synth, {
  oscillator: {
    type: "amtriangle"
  },
  envelope: {
    attack: 0.2,
    decay: 1,
    sustain: 0.3,
    release: 1.2,
  },
}).toDestination();

function updateSequence() {
  if (chordsSequence) {
    chordsSequence.dispose(); // Dispose of the current sequence if it exists
  }

  // Create a new sequence with the updated progression
  chordsSequence = new Tone.Sequence((time, chord) => {
    if (chord) {
      chordSynth.triggerAttackRelease(chord, "4n", time);
      document.getElementById('currentChord').innerText = `Current Chord: ${chord}`;
    }
    // Update progression here if needed, but it won't affect the current sequence
  }, currentProgression, "2n").start(0);
}

function generateRandomVariation(progression) {
    // Function to modify the last chord in the progression
    function modifyLastChord(chord) {
        if (chord.length < 2) {
            return chord; // No modification if the chord doesn't have enough notes to shift
        }

        let rootNote = chord[0]; // Keep the root note
        let notesToShift = chord.slice(1); // Get the notes to shift, excluding the root

        // Randomly shuffle the notes to shift
        for (let i = notesToShift.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [notesToShift[i], notesToShift[j]] = [notesToShift[j], notesToShift[i]];
        }

        // Reassemble the chord with the root note and the shuffled notes
        return [rootNote, ...notesToShift];
    }

    // Apply the modification only to the last chord of the progression
    let modifiedProgression = progression.slice(); // Create a shallow copy to avoid mutating the original
    modifiedProgression[modifiedProgression.length - 1] = modifyLastChord(modifiedProgression[modifiedProgression.length - 1]);

    return modifiedProgression;
}

// Function to periodically update the progression
function periodicallyUpdateProgression() {
  Tone.Transport.scheduleRepeat(() => {
    currentProgression = generateRandomVariation(currentProgression);
    updateSequence(); // Recreate the sequence with the updated progression
  }, "2m");
}

Tone.Transport.loop = true;
Tone.Transport.loopStart = 0;
Tone.Transport.loopEnd = "2:0"; // Loop end can be adjusted based on the total duration of your chord progression
periodicallyUpdateProgression();


// Start/Stop functionality
document.getElementById('playButton').addEventListener('click', async () => {
  await Tone.start();
  if (Tone.Transport.state === 'stopped') {
    Tone.Transport.start();
  } else {
    Tone.Transport.stop();
    index = 0; // Reset the loop index on stop
    document.getElementById('currentChord').innerText = "Current Chord: None"
  }
});

Tone.Transport.bpm.value = 80; // Set BPM to a Lofi-friendly tempo