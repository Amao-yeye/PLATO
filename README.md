# PLATO

**Preintegration-Based Likelihood Maximization from Accurate Trajectory Observations for Neural Inertial Odometry**

[Project page](https://amao-yeye.github.io/PLATO/) · [AquaLux on Hugging Face](https://huggingface.co/datasets/Amao666/AquaLux) · [Method figure](docs/assets/plato-framework.png) · [Dataset documentation](dataset/README.md)

Haoying Li · Qihang Liu · Yifan Peng · Keyan Miao · Junfeng Wu

The project page follows the camera-ready manuscript: overview, method, sparse likelihood and double-adjoint optimization, EuRoC and underwater experiments, training efficiency, and the AquaLux dataset.

The page uses Inter for text, KaTeX's default mathematics fonts for formulas, and a water-blue/teal theme. It includes original method and training-strategy figures plus an interactive explorer for all 20 AquaLux sequences.

The data-only AquaLux preview is hosted on Hugging Face. It contains original stereo event/frame/IMU recordings, mocap-derived reference trajectories, quality masks, calibration, sensor tables and light-off annotations. The GitHub repository contains the project page and reference documentation; algorithm, training and processing implementations are not included.

AquaLux v0.1.0 retains its preview status. Dataset licensing and contact metadata are pending publisher selection; physical reference accuracy and hardware synchronization have not been independently validated. See the dataset card and known issues.
