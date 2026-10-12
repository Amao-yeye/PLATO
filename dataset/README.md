# AquaLux dataset preview · v0.1.0

AquaLux is the underwater dataset associated with PLATO. This distribution contains data and project-page assets. Algorithm, training and processing implementations are not included in this initial release.

- [Project page](https://amao-yeye.github.io/PLATO/)
- [Dataset release and raw recordings](https://github.com/Amao-yeye/PLATO/releases/tag/aqualux-v0.1.0)
- [Dataset card](DATASET_CARD.md)
- [Reference limitations](KNOWN_ISSUES.md)

## Collection

20 original ROS1 recordings: 10 training sequences under generally good lighting and 10 test sequences with intermittent light-off intervals. Together they contain 2,085,742,726 stereo events, 124,725 image messages and 1,556,685 IMU measurements. The original recordings total 38,974,708,279 bytes (36.30 GiB). Images are 346 × 260 at approximately 40 Hz; the IMU is approximately 999 Hz. Motion capture has a nominal rate of 120 Hz.

36 retained light-off intervals total 77.47509 seconds, or 9.78% of test image-stream time.

## Download

The release provides a compact reference-data archive and one gzip-compressed original ROS bag for each of the 20 sequences. Decompress each recording to obtain the original, byte-identical .bag file. No ROS installation is needed to decompress gzip files. A ROS1 bag reader is needed to inspect the original event and image messages.

The reference archive expands to dataset/. Place decompressed original recordings in dataset/raw/ to match manifest paths. RAW_RECORDINGS.json records their expected byte sizes, original SHA256 hashes and download links. Release SHA256SUMS records checksums of the compressed downloads. dataset/SHA256SUMS records checksums of the reference files. Verify against the appropriate manifest after downloading.

## Included reference data

| Path | Content |
| --- | --- |
| manifest.json, sequences.csv | Sequence inventory, clocks, eligibility and sample counts |
| sequences/SEQ/gt_imu.tum | Mocap-derived candidate reference in sensor time and the IMU body frame |
| sequences/SEQ/gt_quality.csv | Validity, continuous segment IDs and rejection reasons |
| sequences/SEQ/vo_imu.tum, vo_tracking.json | Historical visual-odometry baseline and coverage |
| sequences/SEQ/sensors/ | IMU measurements, image timestamps and brightness |
| sequences/SEQ/calibration/, provenance.json | Calibration transforms and processing provenance |
| sequences/SEQ/Body_0.* | Preserved mocap marker exports |
| configuration/ | Camera and platform calibration |
| metadata/ | Light-off annotations and historical alignment summaries |

## Reference conventions

TUM trajectories contain timestamp, translation in meters, and quaternion components in qx, qy, qz, qw order. Released gt_imu.tum timestamps are already transformed from mocap to sensor time; do not apply the clock offset again. Original Body_0.tum remains in mocap time.

Always use the accompanying quality mask. Do not interpolate across invalid rows or different continuous segment IDs. Validity means passing the documented processing policy, not independently established physical accuracy.

Test_005, Test_009 and Test_011 are excluded from default reference evaluation because of flagged historical calibration windows. Their original sensor recordings remain included.

## Preview status

This distribution retains the existing technical-draft status. Data licensing and contact information remain pending publisher selection; LICENSE is a status notice, not a permission grant. Motion-capture-derived references and synchronization have not been independently validated. The two splits share one collection session.

The PLATO manuscript lists Haoying Li, Qihang Liu, Yifan Peng, Keyan Miao and Junfeng Wu. Dataset authorship and formal citation metadata remain as supplied by the publisher.
