# Original music and room sounds

House edition 3.2 includes eight original, 32-bar modal compositions. The game synthesizes its instruments and foley locally through Web Audio: no recordings, external samples, downloaded songs or network requests. These are synthesized interpretations of chamber instruments, not recorded performances.

| Room | Composition | Pace / mode | Arrangement and ambience |
|---|---|---|---|
| Smith | Vellum & Ember | 66 BPM · D Dorian | Gentle flute melody, lute arpeggios, warm strings and hearth |
| Mine | Beneath the Mountain | 52 BPM · E Phrygian | Sparse glass notes, harp, low drone, filtered cavern air and falling water |
| Smelter | River of Bronze | 60 BPM · G minor | Bowed melody, dulcimer, low sustained tones and furnace bellows |
| Forge | The Hammer’s Measure | 82 BPM · D minor | Dulcimer melody, lute pulse and metal strikes |
| Shop | A Brass Bell at the Door | 76 BPM · G major | Light flute and lute; wooden room sounds, coin chimes on trade |
| Arena | Banners in the Dust | 90 BPM · A Dorian | Horn melody, dulcimer ostinato and frame drums |
| Employees | The Long Table | 68 BPM · F Mixolydian | Flute and lute with a quiet communal hearth |
| Legacy | Names in Starlight | 48 BPM · D pentatonic | Glass melody, harp, spacious sustained tones and shimmering chimes |

Each piece has four eight-bar phrases: a statement, answer, higher middle phrase and return. Chords, melody motifs, rests and accompaniment patterns differ by room. Loop lengths range from approximately 85 to 160 seconds. A quiet original stereo reverberation impulse softens the instrumental blend. Music crossfades when changing rooms.

Mining and collecting ore sound a pick strike; crafting and finishing sound a hammer; smelting sounds a pour; purchases, material sales and contract deliveries chime; arena launches sound a drum. Ambient foley belongs to the effects bus, while rhythmic arena drums belong to the musical arrangement. Automatic simulation events do not play repeated action sounds.

Master, music and sound-effects sliders each range from 0–100%. Mute silences the final output. Playback begins after a user gesture, suspends while the page is hidden and resumes when visible. A compressor limits the combined signal, and all instruments have envelopes. Old room sources are stopped and disconnected after the fade; the note-buffer cache is bounded.

## Sources and verification

- Composition and playback source: `house-audio.js`.
- Explicit authoring fixture: `design/qa/audio-review.html`. Its render button uses the same instruments and buses as the game through OfflineAudioContext. It does not access the game save.
- Rendered waveform checks: `design/qa/room-audio-checks.json`. Eighteen seconds of all eight scores are finite, audible and unclipped at default levels. Mute, master zero and both bus volumes zero produce digital silence. This samples the opening passage; it is not a full subjective musical review.
- Playback checks: `design/qa/room-audio-lifecycle.json`. Rapid transitions dispose of old voices; suspension, resumption and stopping pass in the browser.
- The authoring fixture includes a browser audio player for the rendered 18-second forge excerpt, plus live audition controls for every room.

The portable HTML bundles the complete scores and synthesizer, with no additional audio files needed during play.
