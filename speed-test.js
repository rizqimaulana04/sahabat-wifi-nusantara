/**
 * Speed Test HTTP satu koneksi menggunakan endpoint publik Cloudflare.
 * Seluruh angka berasal dari transfer nyata; hasil bukan jaminan kecepatan paket.
 * Tidak memerlukan API key atau backend. Tidak menyimpan hasil pengujian.
 */
(() => {
  'use strict';

  const ENDPOINT = 'https://speed.cloudflare.com';
  const REQUEST_TIMEOUT = 15000;
  const TOTAL_TIMEOUT = 60000;
  const DOWNLOAD_SIZES = [1000000, 4000000, 8000000, 12000000];
  const UPLOAD_SIZES = [1000000, 4000000, 6000000];
  const ui = {
    panel: document.querySelector('.speed-panel'),
    needle: document.querySelector('#gauge-needle'),
    start: document.querySelector('#start-test'),
    stop: document.querySelector('#stop-test'),
    status: document.querySelector('#speed-status'),
    progress: document.querySelector('#test-progress'),
    phase: document.querySelector('#gauge-phase'),
    gauge: document.querySelector('#gauge-value'),
    arc: document.querySelector('#gauge-progress'),
    server: document.querySelector('#test-server'),
    download: document.querySelector('#download-value'),
    upload: document.querySelector('#upload-value'),
    latency: document.querySelector('#latency-value'),
    jitter: document.querySelector('#jitter-value')
  };

  let running = false;
  let controller = null;
  let userCancelled = false;
  let totalTimedOut = false;
  const format = value => value.toLocaleString('id-ID', {
    minimumFractionDigits: 1, maximumFractionDigits: 1
  });
  const median = values => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  function showGauge(value) {
    ui.gauge.textContent = format(value);
    ui.arc.style.strokeDasharray = `${Math.min(100, value / 2)} 100`;
    ui.needle.style.rotate = `${-135 + Math.min(200, value) / 200 * 270}deg`;
  }

  /** Points come only from completed network transfers, with no simulated data. */
  function drawChart(upload, samples) {
    const chart = document.querySelector(upload ? '#upload-chart' : '#download-chart');
    const maximum = Math.max(100, ...samples);
    const points = samples.map((value, index) => {
      const x = samples.length === 1 ? 150 : index * 300 / (samples.length - 1);
      return [x, 65 - value / maximum * 58];
    });
    const line = points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    chart.querySelector('.chart-line').setAttribute('d', line);
    const firstX = points[0][0], lastX = points[points.length - 1][0];
    chart.querySelector('.chart-area').setAttribute('d', `${line} L${lastX} 65 L${firstX} 65 Z`);
    // A single measured sample is represented by a point, not a made-up line.
    chart.querySelectorAll('circle').forEach(point => point.remove());
    points.forEach(([x, y]) => {
      const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      point.setAttribute('cx', x);
      point.setAttribute('cy', y);
      point.setAttribute('r', '3');
      chart.append(point);
    });
    chart.setAttribute('aria-label', `Sampel ${upload ? 'unggah' : 'unduh'}: ${samples.map(format).join('; ')} Mbps.`);
  }

  function showPhase(label, status, progress) {
    ui.phase.textContent = label;
    ui.status.textContent = status;
    ui.progress.value = progress;
  }

  /** Timeout mencakup pengunduhan body, bukan hanya header respons. */
  async function transfer({ bytes, upload = false }) {
    const requestController = new AbortController();
    const onCancel = () => requestController.abort();
    const parentSignal = controller.signal;
    if (parentSignal.aborted) throw new DOMException('Aborted', 'AbortError');
    parentSignal.addEventListener('abort', onCancel, { once: true });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      requestController.abort();
    }, REQUEST_TIMEOUT);

    try {
      let payload;
      if (upload) {
        payload = new Uint8Array(bytes);
        // Data uji sintetis; batas getRandomValues adalah 65536 byte per panggilan.
        for (let offset = 0; offset < bytes; offset += 65536) {
          crypto.getRandomValues(payload.subarray(offset, Math.min(offset + 65536, bytes)));
        }
      }
      const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const url = upload
        ? `${ENDPOINT}/__up?nonce=${nonce}`
        : `${ENDPOINT}/__down?bytes=${bytes}&nonce=${nonce}`;
      const start = performance.now();
      const response = await fetch(url, {
        method: upload ? 'POST' : 'GET',
        body: payload,
        credentials: 'omit',
        cache: 'no-store',
        signal: requestController.signal
      });
      if (!response.ok) throw new Error(`Server pengujian merespons HTTP ${response.status}.`);
      const received = await response.arrayBuffer();
      const duration = performance.now() - start;
      if (!upload && received.byteLength !== bytes) {
        throw new Error('Transfer download tidak lengkap. Silakan coba kembali.');
      }
      const colo = response.headers.get('cf-meta-colo');
      if (colo) {
        ui.server.textContent = `CLOUDFLARE / ${colo}`;
        document.querySelector('#server-detail').textContent = `Edge ${colo} · dipilih otomatis`;
      }
      return { duration, mbps: (bytes * 8) / (duration * 1000) };
    } catch (error) {
      if (timedOut && !parentSignal.aborted) {
        throw new Error('Respons server terlalu lama. Periksa koneksi dan coba lagi.');
      }
      throw error;
    } finally {
      clearTimeout(timer);
      parentSignal.removeEventListener('abort', onCancel);
    }
  }

  async function measureLatency() {
    showPhase('MEASURING LATENCY', 'Memeriksa waktu respons koneksi…', 4);
    await transfer({ bytes: 1000 }); // Warm-up koneksi TLS, tidak masuk statistik.
    const samples = [];
    for (let i = 0; i < 5; i++) {
      const result = await transfer({ bytes: 1000 });
      samples.push(result.duration);
      ui.progress.value = 5 + ((i + 1) / 5) * 15;
    }
    const differences = samples.slice(1).map((value, i) => Math.abs(value - samples[i]));
    ui.latency.textContent = format(median(samples));
    ui.jitter.textContent = format(differences.reduce((sum, value) => sum + value, 0) / differences.length);
  }

  async function measureBandwidth(upload) {
    const sizes = upload ? UPLOAD_SIZES : DOWNLOAD_SIZES;
    const samples = [];
    const progressStart = upload ? 65 : 20;
    const range = upload ? 33 : 43;
    showPhase(upload ? 'MEASURING UPLOAD' : 'MEASURING DOWNLOAD',
      upload ? 'Mengirim data uji sintetis…' : 'Mengunduh data uji…', progressStart);
    for (let i = 0; i < sizes.length; i++) {
      const result = await transfer({ bytes: sizes[i], upload });
      samples.push(result.mbps);
      drawChart(upload, samples);
      const measured = median(samples);
      (upload ? ui.upload : ui.download).textContent = format(measured);
      showGauge(measured);
      ui.progress.value = progressStart + ((i + 1) / sizes.length) * range;
      // Hindari transfer semakin besar pada koneksi yang sudah membutuhkan >3 detik.
      if (result.duration > 3000) break;
    }
  }

  async function startTest() {
    if (running) return;
    if (!navigator.onLine) {
      ui.status.textContent = 'Anda sedang offline. Hubungkan internet sebelum menjalankan tes.';
      return;
    }
    running = true;
    ui.panel.dataset.state = 'running';
    userCancelled = false;
    totalTimedOut = false;
    controller = new AbortController();
    ui.start.disabled = true;
    ui.stop.hidden = false;
    ui.progress.value = 0;
    ui.arc.style.strokeDasharray = '0 100';
    ui.needle.style.rotate = '-135deg';
    document.querySelector('#server-detail').textContent = 'Menghubungkan server…';
    document.querySelectorAll('.transfer-chart').forEach(chart => {
      chart.querySelector('.chart-area').setAttribute('d', '');
      chart.querySelector('.chart-line').setAttribute('d', '');
      chart.querySelectorAll('circle').forEach(point => point.remove());
      chart.setAttribute('aria-label', 'Belum ada sampel pengukuran.');
    });
    ui.server.textContent = 'CLOUDFLARE EDGE';
    [ui.download, ui.upload, ui.latency, ui.jitter, ui.gauge].forEach(el => { el.textContent = '—'; });
    document.querySelector('#speed-gauge').classList.add('is-testing');
    const timer = setTimeout(() => {
      totalTimedOut = true;
      controller.abort();
    }, TOTAL_TIMEOUT);

    try {
      await measureLatency();
      await measureBandwidth(false);
      await measureBandwidth(true);
      // Tampilkan download sebagai angka utama setelah seluruh tahap selesai.
      ui.gauge.textContent = ui.download.textContent;
      const download = Number(ui.download.textContent.replace(/\./g, '').replace(',', '.'));
      ui.arc.style.strokeDasharray = `${Math.min(100, download / 2)} 100`;
      showGauge(download);
      showPhase('TEST COMPLETE / DOWNLOAD', 'Tes selesai. Ini estimasi koneksi saat pengujian, bukan jaminan kecepatan paket.', 100);
      ui.start.textContent = 'Uji ulang';
      ui.start.setAttribute('aria-label', 'Uji ulang Speed Test');
    } catch (error) {
      if (userCancelled) {
        ui.phase.textContent = 'TEST STOPPED';
        ui.status.textContent = 'Tes dihentikan. Angka yang tampil adalah hasil tahap yang sudah selesai.';
      } else {
        ui.phase.textContent = 'TEST INCOMPLETE';
        ui.status.textContent = totalTimedOut
          ? 'Waktu pengujian habis. Hasil belum lengkap; coba lagi atau buka tes lengkap Cloudflare.'
          : `${error.name === 'TypeError' ? 'Tidak dapat terhubung ke server. Periksa internet, VPN, atau pemblokir browser.' : error.message} Hasil belum lengkap.`;
      }
      ui.start.textContent = 'Coba lagi';
      ui.start.setAttribute('aria-label', 'Coba lagi Speed Test');
    } finally {
      clearTimeout(timer);
      running = false;
      ui.panel.dataset.state = 'complete';
      ui.start.disabled = false;
      ui.stop.hidden = true;
      document.querySelector('#speed-gauge').classList.remove('is-testing');
    }
  }

  ui.start.addEventListener('click', startTest);
  ui.stop.addEventListener('click', () => {
    userCancelled = true;
    controller?.abort();
  });
  window.addEventListener('pagehide', () => controller?.abort());
})();
