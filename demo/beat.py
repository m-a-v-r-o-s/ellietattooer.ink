"""python3 demo/beat.py out.wav SECONDS: an original lofi boom-bap loop (synthesized, so no licence
to clear) for the promo reel. Starts on the beat, fades out over the last second."""
import sys
import wave

import numpy as np

SR = 44100
BPM = 90
STEP = 60 / BPM / 4  # one 16th
SWING = 0.16  # late offbeat 16ths, as a fraction of a 16th
rng = np.random.default_rng(7)


def env(n, decay):
    return np.exp(-np.arange(n) / SR / decay)


def lowpass(x, fc, order=2):
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(np.fft.rfft(x) / np.sqrt(1 + (f / fc) ** (2 * order)), len(x))


def highpass(x, fc, order=2):
    f = np.fft.rfftfreq(len(x), 1 / SR) + 1e-9
    return np.fft.irfft(np.fft.rfft(x) / np.sqrt(1 + (fc / f) ** (2 * order)), len(x))


def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    freq = 45 + 75 * np.exp(-t / 0.035)
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * env(n, 0.22)
    click = lowpass(rng.standard_normal(n), 3000) * env(n, 0.004) * 0.4
    return np.tanh(1.6 * (body + click))


def snare():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    noise = highpass(lowpass(rng.standard_normal(n), 6000), 900) * env(n, 0.09)
    tone = np.sin(2 * np.pi * 185 * t) * env(n, 0.05)
    return 0.55 * noise + 0.45 * tone


def hat():
    n = int(0.08 * SR)
    return highpass(rng.standard_normal(n), 7000, 3) * env(n, 0.018)


def keys(freqs, dur):
    """Rhodes-ish: FM bell attack over a soft sine body, gentle tremolo."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for f in freqs:
        idx = 1.4 * np.exp(-t / 0.25)
        out += np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t)) * env(n, 1.6)
    out *= 1 + 0.12 * np.sin(2 * np.pi * 4.5 * t)
    att = np.minimum(1, t / 0.008)
    rel = np.minimum(1, (dur - t) / 0.08)
    return out * att * rel / len(freqs)


def bass(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    return np.tanh(1.3 * x) * env(n, 0.6) * np.minimum(1, t / 0.005) * np.minimum(1, (dur - t) / 0.04)


def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def place(track, sound, at, gain=1.0):
    i = int(at * SR)
    if i >= len(track):
        return
    end = min(len(track), i + len(sound))
    track[i:end] += gain * sound[: end - i]


def step_time(bar, step):
    return (bar * 16 + step + (SWING if step % 2 else 0)) * STEP


def main(out, seconds):
    n = int(seconds * SR)
    drums, music, low = np.zeros(n), np.zeros(n), np.zeros(n)
    bar_len = 16 * STEP
    # Fm9, Bbm9, Dbmaj7, C7#9 (voicings in MIDI), roots an octave or two down
    chords = [
        ([56, 60, 63, 67], 41),
        ([56, 61, 65, 72], 46),
        ([56, 60, 63, 65], 37),
        ([52, 58, 63, 64], 36),
    ]
    K, S, H = kick(), snare(), hat()
    bars = int(np.ceil(seconds / bar_len))
    for b in range(bars):
        voicing, root = chords[b % 4]
        # chord stabs: on 1 and a pushed one before 3
        place(music, keys([hz(m) for m in voicing], 2.2 * 4 * STEP), step_time(b, 0))
        place(music, keys([hz(m) for m in voicing], 1.5 * 4 * STEP), step_time(b, 7), 0.6)
        for s, g in ((0, 1.0), (7, 0.7), (10, 0.9)):
            place(drums, K, step_time(b, s), g)
            place(low, bass(hz(root), 5 * STEP), step_time(b, s), g)
        for s in (4, 12):
            place(drums, S, step_time(b, s), 0.85)
        place(drums, S, step_time(b, 15), 0.18)  # ghost
        for s in range(0, 16, 2):
            place(drums, H, step_time(b, s), 0.3 + 0.12 * rng.random())
        if b % 2:
            place(drums, H, step_time(b, 13), 0.2)

    # room on the snare/keys, via FFT convolution with a decaying noise tail
    ir = lowpass(rng.standard_normal(int(0.9 * SR)), 4000) * env(int(0.9 * SR), 0.25)
    m = n + len(ir)
    verb = np.fft.irfft(np.fft.rfft(music + 0.4 * drums, m) * np.fft.rfft(ir, m), m)[:n]
    verb /= np.abs(verb).max() + 1e-9

    crackle = np.zeros(n)
    pops = rng.choice(n, int(seconds * 7), replace=False)
    crackle[pops] = rng.uniform(-1, 1, len(pops))
    crackle = highpass(crackle, 1500) * 0.5 + lowpass(rng.standard_normal(n), 1200) * 0.01

    mix = 0.55 * drums + 0.38 * lowpass(music, 2600) + 0.08 * verb + 0.35 * low + 0.06 * crackle
    mix = lowpass(mix, 9000)
    mix = np.tanh(1.2 * mix)
    t = np.arange(n) / SR
    mix *= np.minimum(1, (seconds - t) / 1.0) * np.minimum(1, t / 0.01)
    mix *= 0.89 / np.abs(mix).max()

    with wave.open(out, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype("<i2").tobytes())


if __name__ == "__main__":
    main(sys.argv[1], float(sys.argv[2]))
