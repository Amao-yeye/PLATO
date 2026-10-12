# AquaLux dataset card

## Data and intended use

The dataset supports visual/event odometry robustness studies, candidate mocap-derived trajectory supervision and IMU residual research. The 20 raw ROS1 bags contain 1,556,685 IMU measurements, 124,725 stereo image messages and 2,085,742,726 individual events over approximately 26 minutes of image-stream time. Raw bag size is 38,974,708,279 bytes. These counts refer to the preserved source recordings.

Training sequences are Train_000 through Train_018 at even IDs; testing sequences are Test_001 through Test_019 at odd IDs. This split separates generally good image quality from partial light-off conditions. Both sets come from the same collection session; the split does not establish generalization to other sites, devices or sessions. No validation split is prescribed.

## Sensors and units

| Topic | ROS1 message | Units |
| --- | --- | --- |
| `/davis_left/events`, `/davis_right/events` | `dvs_msgs/EventArray` | Integer x/y coordinates, per-event timestamp, polarity |
| `/davis_left/image_raw`, `/davis_right/image_raw` | `sensor_msgs/Image` | 346 × 260 mono8 grayscale, header acquisition timestamp |
| `/davis_left/imu` | `sensor_msgs/Imu` | Angular velocity rad/s, specific force m/s² |

The observed frame period is approximately 25 ms; IMU periods are 1.001–1.002 ms. Nearest left/right image timestamps differ by at most 0.892 ms. Events use top-left pixel origin. Camera optical axes follow the stored ROS image convention: x right, y down, z forward. IMU vectors remain in the recorded body frame and are never rotated into the world by the release builder. Their relationship to the left camera is the supplied extrinsic; a separate physical axis survey is unavailable.

## Clocks and frames

`T_A_B` maps coordinates from B to A. M is the mocap rigid-body frame, C1 the left camera, I the IMU body, Wm the mocap world, and Wv the historical VO world. The builder uses the actual per-sequence `T_M_I` to form `T_Wm_I = T_Wm_M @ T_M_I`. Training transforms were independently fitted and do not exactly equal `T_M_C @ T_C1_I_used`; the discrepancy is reported rather than silently changing the extrinsics.

The legacy calibration queried mocap at `t_sensor + offset`. Therefore new GT timestamps are `t_mocap - offset`; IMU, images and VO keep their sensor timestamps. Fourteen sequences use the recorded 0.4 s offset and six use 0.8 s. Those values came from coarse VO-based scans and remain estimates. Apparent epoch timestamps do not imply independently synchronized hardware clocks.

Gravity alignment is recomputed from the mean `R_Wm_I @ acc_body` using only valid synchronized GT/IMU overlap. The mean direction is rotated to world +z, and the first valid GT position is used as the common GT/VO origin. Integration gravity is `[0, 0, -9.7879]` m/s². Motion and sensor bias can affect this gravity estimate; yaw and absolute world origin are conventions, not surveyed coordinates. Parameters are saved in each provenance file.

## Quality and label semantics

GT adjacent intervals below 1 ms or above 50 ms trigger an exclusion from the earlier timestamp minus 0.12 s through the later timestamp plus 0.12 s. GT outside the IMU time range is also excluded. `gt_quality.csv` aligns exactly with GT rows; valid segment IDs are nonnegative and invalid rows use `-1`. Both pose and derivative flags conservatively reject the same intervals. Validity means passing this policy, not proven physical accuracy.

VO duplicate timestamps are collapsed only when their poses agree within numeric tolerance. Conflicting poses stop the build. Tracking metadata describes gaps and exact available image-frame timestamps; original map IDs and reliable relocalization events are unavailable. No missing VO poses are synthesized.

Light-off labels use left-image mean brightness below 5, merge gaps up to 0.5 s and keep intervals lasting at least 1 s. There are 36 retained intervals totaling 77.47509 s, about 9.78% of test image-stream duration. Per-image dark flags preserve threshold results, including short dark runs that are absent from merged interval labels.

Optional pseudo-bias labels are constructed at 125 Hz within valid continuous segments from measured IMU minus GT-derived motion. Position/velocity and residuals use 15-sample Savitzky–Golay filtering; edge rows are discarded. Each row includes its segment and interval end. These labels combine sensor error, synchronization error, mocap noise, differentiation and modeling residuals; they are not independently measured hardware bias. Flagged calibration sequences produce no new bias rows.

## Provenance and release status

v0.1.0 preserves original recordings and source mocap exports. Corrected trajectories, masks, extracted sensor tables and regenerated auxiliary labels are separate versioned products. SHA256 digests identify all archived files. Calibration inputs and relevant source digests are recorded per sequence; the generation environment is recorded in `build_environment.json`.

Dataset authorship, contact, data licensing and optional paper/DOI remain to be supplied by the publisher. See `release_metadata.json`. Exact original ROS and ORB-SLAM3 versions, mocap hardware specifications and independent physical GT accuracy remain unknown. The current technical checks do not establish full image-content or vendor-metadata suitability for public disclosure.
