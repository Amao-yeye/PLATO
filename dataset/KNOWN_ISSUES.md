# AquaLux known issues

## Time and ground truth

Historical ATO GT files retain mocap timestamps, while the legacy alignment selected nonzero offsets. Historical same-grid bias checks establish index alignment, not physical clock synchronization. v0.1.0 shifts only its new GT timestamps; old ATO and diagnostic files remain historical artifacts.

Mocap time gaps and timestamp batches occur notably in Train_000, Test_007 and Test_019: gaps are approximately 0.673, 0.654 and 0.673 seconds, followed by densely grouped timestamps. Smaller anomalies occur in other sequences. The release masks these intervals rather than inventing acquisition timestamps. The underlying buffering or clock cause is unconfirmed.

The recorded offsets were selected on a 0.4 s grid. The default masks do not establish that residual synchronization error is negligible. Per-sequence marker extrinsics vary substantially, including two orientation groups; marker setup records or independent calibration would be needed to confirm their physical interpretation. Low fitted VO/mocap errors do not independently validate GT accuracy.

## Calibration exclusions

| Sequence | Why excluded from default use |
| --- | --- |
| Test_005 | Historical first-window fit includes frames labeled dark at its end |
| Test_009 | Historical first-window fit includes frames labeled dark at its end |
| Test_011 | First available historical VO starts about 42.25 s after recording begins; its calibration window also contains darkness |

Exclusions describe the supplied historical calibration. The conservative builder does not rerun ORB-SLAM3 or claim to repair these extrinsics. The recordings remain available for raw-sensor studies and explicit exploratory analysis.

## Baseline coverage

The historical test VO contains 3167 redundant repeated rows, removed in v0.1.0. Test_011 covers only approximately 42.25–69.95 s of a 76.38 s image stream. Test_013 misses approximately the final 20.20 s and Test_019 approximately the final 29.70 s. Other sequences have internal gaps. Reporting only matched-pose error would omit those failures; the evaluator also reports coverage and missing runs.

## Reproduction and publication

The new pipeline is deterministic from the supplied workspace. Its pinned Python environment and ROS-free reader are separate from the historical ROS1/ORB workflow, whose exact versions are unknown. The original full draft supported loading and evaluation; this initial data-only distribution omits those implementations. Complete regeneration from raw sensors also requires the historical alignment inputs or a newly validated calibration run.

The release remains a draft until the publisher supplies dataset authorship/contact details and a selected data license. Templates grant no usage rights. This release does not include an independent hardware bias reference, physical GT accuracy certificate, or completed full-content disclosure review.

Repeated builds using the same pinned binary environment reproduce data and manifest bytes exactly. Different binary builds of the same numerical-library versions can change last digits; a Train_000 comparison observed maximum absolute differences of approximately 1e-12 in GT TUM values and 1e-11 in auxiliary bias values. File checksums verify a particular distributed artifact, rather than equivalence across numerical environments.
