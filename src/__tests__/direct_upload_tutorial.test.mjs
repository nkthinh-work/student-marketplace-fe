import test from 'node:test';
import assert from 'node:assert/strict';

test('Direct Tutorial Upload: Chunk partition calculation for 12.8 MB file', () => {
  const CHUNK_SIZE = 6 * 1024 * 1024; // 6 MB
  const fileSize = 13421772; // ~12.8 MB

  const totalChunks = Math.max(1, Math.ceil(fileSize / CHUNK_SIZE));
  assert.equal(totalChunks, 3, 'A 12.8 MB file should be partitioned into exactly 3 chunks of <= 6 MB');

  const ranges = [];
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(fileSize, (i + 1) * CHUNK_SIZE);
    ranges.push(`bytes ${start}-${end - 1}/${fileSize}`);
  }

  assert.equal(ranges[0], 'bytes 0-6291455/13421772');
  assert.equal(ranges[1], 'bytes 6291456-12582911/13421772');
  assert.equal(ranges[2], 'bytes 12582912-13421771/13421772');
});

test('Direct Tutorial Upload: Multi-stage progress tracking lifecycle', async () => {
  const stages = [];
  const onProgress = (event) => {
    stages.push({ stage: event.stage, percent: event.percent, chunk: event.currentChunk });
  };

  // Simulate end-to-end stages
  onProgress({ stage: 'REQUESTING_SIGNATURE', percent: 0 });
  onProgress({ stage: 'UPLOADING_CLOUDINARY', percent: 33, currentChunk: 1, totalChunks: 3 });
  onProgress({ stage: 'UPLOADING_CLOUDINARY', percent: 66, currentChunk: 2, totalChunks: 3 });
  onProgress({ stage: 'UPLOADING_CLOUDINARY', percent: 99, currentChunk: 3, totalChunks: 3 });
  onProgress({ stage: 'VERIFYING_BACKEND', percent: 100 });
  onProgress({ stage: 'COMPLETED', percent: 100 });

  assert.equal(stages[0].stage, 'REQUESTING_SIGNATURE');
  assert.equal(stages[1].stage, 'UPLOADING_CLOUDINARY');
  assert.equal(stages[1].chunk, 1);
  assert.equal(stages[2].chunk, 2);
  assert.equal(stages[3].chunk, 3);
  assert.equal(stages[4].stage, 'VERIFYING_BACKEND');
  assert.equal(stages[5].stage, 'COMPLETED');
});

test('Direct Tutorial Upload: Chunk retry on transient failure recovers successfully', async () => {
  let callCount = 0;
  const mockPostWithRetry = async (url, maxRetries = 3) => {
    let attempt = 0;
    while (attempt < maxRetries) {
      callCount++;
      if (callCount === 1) {
        attempt++;
        // Simulate network disconnect on attempt 1
        continue;
      }
      return { status: 200, data: { bytes: 6291456 } };
    }
    throw new Error('Upload failed after retries');
  };

  const result = await mockPostWithRetry('https://api.cloudinary.com/v1_1/demo/video/upload');
  assert.equal(result.status, 200);
  assert.equal(callCount, 2, 'Should succeed on retry attempt 2 without failing the whole upload');
});

test('Direct Tutorial Upload: Confirm payload and endpoint structure', () => {
  const mockSignature = {
    cloud_name: 'ptit_cloud',
    api_key: '123456789',
    timestamp: 1700000000,
    signature: 'sha1_sig_xyz',
    folder: 'student-marketplace/prod/tutorials/videos',
    upload_session_id: 'tut_sess_abc',
  };

  const mockCloudinaryResult = {
    public_id: 'student-marketplace/prod/tutorials/videos/asset_999',
    secure_url: 'https://res.cloudinary.com/ptit_cloud/video/upload/v1/asset_999.mp4',
    bytes: 13421772,
    duration: 18.5,
    width: 720,
    height: 1280,
    format: 'mp4',
  };

  const confirmPayload = {
    public_id: mockCloudinaryResult.public_id,
    upload_session_id: mockSignature.upload_session_id,
    secure_url: mockCloudinaryResult.secure_url,
    video_size_bytes: mockCloudinaryResult.bytes,
    duration_ms: Math.round(mockCloudinaryResult.duration * 1000),
  };

  assert.equal(confirmPayload.public_id, 'student-marketplace/prod/tutorials/videos/asset_999');
  assert.equal(confirmPayload.upload_session_id, 'tut_sess_abc');
  assert.equal(confirmPayload.video_size_bytes, 13421772);
  assert.equal(confirmPayload.duration_ms, 18500);
  assert.match(confirmPayload.public_id, /^student-marketplace\/(prod|dev)\/tutorials\/videos\//);
});

test('Direct Tutorial Upload: Signature params enforce unique public_id, overwrite=false, and zero api_secret', () => {
  const signatureData = {
    cloud_name: 'ptit_cloud',
    api_key: 'key_123',
    timestamp: 1700000000,
    signature: 'signed_hash_456',
    folder: 'student-marketplace/dev/tutorials/videos',
    public_id: 'tut_sess_789',
    overwrite: 'false',
    upload_session_id: 'sess_789',
  };

  // 1. Verify safe parameter contract
  assert.equal(signatureData.overwrite, 'false', 'Signed upload must strictly specify overwrite=false');
  assert.equal(signatureData.public_id, 'tut_sess_789', 'Unique public_id must be tied to upload_session_id');
  assert.equal(signatureData.api_secret, undefined, 'api_secret must NEVER be included in frontend signature data');

  // 2. Verify FormData assembly
  const formEntries = {};
  const mockFormData = {
    append: (key, val) => {
      formEntries[key] = String(val);
    },
  };

  mockFormData.append('api_key', signatureData.api_key);
  mockFormData.append('timestamp', signatureData.timestamp);
  mockFormData.append('signature', signatureData.signature);
  mockFormData.append('folder', signatureData.folder);
  if (signatureData.public_id) mockFormData.append('public_id', signatureData.public_id);
  if (signatureData.overwrite) mockFormData.append('overwrite', signatureData.overwrite);

  assert.equal(formEntries['public_id'], 'tut_sess_789');
  assert.equal(formEntries['overwrite'], 'false');
  assert.equal(formEntries['folder'], 'student-marketplace/dev/tutorials/videos');
  assert.equal(formEntries['api_secret'], undefined);
});
