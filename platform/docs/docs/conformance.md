---
sidebar_position: 12
sidebar_label: DICOM Conformance Statement
title: DICOM Conformance Statement
summary: OHIF Viewer DICOM Conformance Statement per DICOM PS3.2
---

<!-- markdownlint-disable MD013 MD033 -->

# DICOM Conformance Statement — OHIF Viewer v3.13

## 1. Introduction

The OHIF Viewer is a web-based medical image viewer that retrieves and displays DICOM objects via DICOMweb (WADO-RS, QIDO-RS, STOW-RS) or local file loading. This document describes its DICOM conformance per DICOM PS3.2.

**Implementation Model:** Web Application (browser-based, zero-footprint)

**Application Entity:** OHIF Viewer does not implement a DICOM AE directly. It communicates via DICOMweb HTTP/REST APIs with a PACS or archive that provides the DICOM AE.

## 2. Table of Contents

- [Supported SOP Classes](#3-supported-sop-classes)
- [Transfer Syntaxes](#4-transfer-syntax-support)
- [Network Services](#5-network-services)
- [Media Storage](#6-media-storage)
- [Structured Reporting](#7-structured-reporting)
- [Segmentation](#8-segmentation)
- [Communication Profiles](#9-communication-profiles)

## 3. Supported SOP Classes

### 3.1 Image Storage SOP Classes (Display)

| SOP Class Name | SOP Class UID | Support |
|---|---|---|
| Computed Radiography Image | 1.2.840.10008.5.1.4.1.1.1 | Full |
| Digital X-Ray Image (Presentation) | 1.2.840.10008.5.1.4.1.1.1.1 | Full |
| Digital X-Ray Image (Processing) | 1.2.840.10008.5.1.4.1.1.1.1.1 | Full |
| Digital Mammography X-Ray Image (Presentation) | 1.2.840.10008.5.1.4.1.1.1.2 | Full |
| Digital Mammography X-Ray Image (Processing) | 1.2.840.10008.5.1.4.1.1.1.2.1 | Full |
| CT Image | 1.2.840.10008.5.1.4.1.1.2 | Full |
| Enhanced CT Image | 1.2.840.10008.5.1.4.1.1.2.1 | Full |
| Legacy Converted Enhanced CT Image | 1.2.840.10008.5.1.4.1.1.2.2 | Full |
| Ultrasound Multi-frame Image | 1.2.840.10008.5.1.4.1.1.3.1 | Full |
| MR Image | 1.2.840.10008.5.1.4.1.1.4 | Full |
| Enhanced MR Image | 1.2.840.10008.5.1.4.1.1.4.1 | Full |
| Enhanced MR Color Image | 1.2.840.10008.5.1.4.1.1.4.3 | Full |
| Legacy Converted Enhanced MR Image | 1.2.840.10008.5.1.4.1.1.4.4 | Full |
| Ultrasound Image | 1.2.840.10008.5.1.4.1.1.6.1 | Full |
| Enhanced US Volume | 1.2.840.10008.5.1.4.1.1.6.2 | Full |
| Nuclear Medicine Image | 1.2.840.10008.5.1.4.1.1.20 | Full |
| Positron Emission Tomography Image | 1.2.840.10008.5.1.4.1.1.128 | Full |
| Enhanced PET Image | 1.2.840.10008.5.1.4.1.1.130 | Full |
| Legacy Converted Enhanced PET Image | 1.2.840.10008.5.1.4.1.1.128.1 | Full |
| X-Ray Angiographic Image | 1.2.840.10008.5.1.4.1.1.12.1 | Full |
| X-Ray Radiofluoroscopic Image | 1.2.840.10008.5.1.4.1.1.12.2 | Full |
| Breast Tomosynthesis Image | 1.2.840.10008.5.1.4.1.1.13.1.3 | Full |
| VL Whole Slide Microscopy Image | 1.2.840.10008.5.1.4.1.1.77.1.6 | Full |
| RT Image | 1.2.840.10008.5.1.4.1.1.481.1 | Full |
| Secondary Capture Image | 1.2.840.10008.5.1.4.1.1.7 | Full |
| Multi-frame Single Bit SC Image | 1.2.840.10008.5.1.4.1.1.7.1 | Full |
| Multi-frame Grayscale Byte SC Image | 1.2.840.10008.5.1.4.1.1.7.2 | Full |
| Multi-frame Grayscale Word SC Image | 1.2.840.10008.5.1.4.1.1.7.3 | Full |
| Multi-frame True Color SC Image | 1.2.840.10008.5.1.4.1.1.7.4 | Full |

### 3.2 Non-Image SOP Classes

| SOP Class Name | SOP Class UID | Support |
|---|---|---|
| Encapsulated PDF | 1.2.840.10008.5.1.4.1.1.104.1 | Full |
| Basic Text SR | 1.2.840.10008.5.1.4.1.1.88.11 | Read + Write (TID 1500) |
| Enhanced SR | 1.2.840.10008.5.1.4.1.1.88.22 | Read + Write (TID 1500) |
| Comprehensive SR | 1.2.840.10008.5.1.4.1.1.88.33 | Read + Write (TID 1500) |
| Comprehensive 3D SR | 1.2.840.10008.5.1.4.1.1.88.34 | Read + Write (TID 1500) |
| Segmentation | 1.2.840.10008.5.1.4.1.1.66.4 | Full |
| Labelmap Segmentation | 1.2.840.10008.5.1.4.1.1.66.7 | Full |
| RT Structure Set | 1.2.840.10008.5.1.4.1.1.481.3 | Read |
| Parametric Map | 1.2.840.10008.5.1.4.1.1.30 | Full |
| Video Endoscopic Image | 1.2.840.10008.5.1.4.1.1.77.1.1.1 | Full |
| Video Microscopic Image | 1.2.840.10008.5.1.4.1.1.77.1.2.1 | Full |
| Video Photographic Image | 1.2.840.10008.5.1.4.1.1.77.1.4.1 | Full |

### 3.3 Waveform SOP Classes

| SOP Class Name | SOP Class UID | Support |
|---|---|---|
| 12-Lead ECG Waveform | 1.2.840.10008.5.1.4.1.1.9.1.1 | Full |
| General ECG Waveform | 1.2.840.10008.5.1.4.1.1.9.1.2 | Full |
| Ambulatory ECG Waveform | 1.2.840.10008.5.1.4.1.1.9.1.3 | Full |
| Hemodynamic Waveform | 1.2.840.10008.5.1.4.1.1.9.2.1 | Full |
| Cardiac Electrophysiology Waveform | 1.2.840.10008.5.1.4.1.1.9.3.1 | Full |

## 4. Transfer Syntax Support

### 4.1 Uncompressed

| Transfer Syntax | UID | Support |
|---|---|---|
| Implicit VR Little Endian | 1.2.840.10008.1.2 | Full |
| Explicit VR Little Endian | 1.2.840.10008.1.2.1 | Full |
| Explicit VR Big Endian | 1.2.840.10008.1.2.2 | Full |

### 4.2 Lossless Compression

| Transfer Syntax | UID | Support |
|---|---|---|
| JPEG Lossless (Process 14) | 1.2.840.10008.1.2.4.57 | Full |
| JPEG Lossless (Process 14, SV1) | 1.2.840.10008.1.2.4.70 | Full |
| JPEG-LS Lossless | 1.2.840.10008.1.2.4.80 | Full |
| JPEG 2000 Lossless | 1.2.840.10008.1.2.4.90 | Full |
| JPEG 2000 Part 2 Lossless | 1.2.840.10008.1.2.4.92 | Full |
| RLE Lossless | 1.2.840.10008.1.2.5 | Full |

### 4.3 Lossy Compression

| Transfer Syntax | UID | Support |
|---|---|---|
| JPEG Baseline (Process 1) | 1.2.840.10008.1.2.4.50 | Full |
| JPEG Extended (Process 2 and 4) | 1.2.840.10008.1.2.4.51 | Full |
| JPEG-LS Near-Lossless | 1.2.840.10008.1.2.4.81 | Full |
| JPEG 2000 | 1.2.840.10008.1.2.4.91 | Full |
| JPEG 2000 Part 2 | 1.2.840.10008.1.2.4.93 | Full |

### 4.4 Video

| Transfer Syntax | UID | Support |
|---|---|---|
| MPEG-4 AVC/H.264 High Profile | 1.2.840.10008.1.2.4.102 | Full |
| MPEG-4 AVC/H.264 BD-Compatible | 1.2.840.10008.1.2.4.103 | Full |
| HEVC/H.265 Main Profile | 1.2.840.10008.1.2.4.107 | Full |
| HEVC/H.265 Main 10 Profile | 1.2.840.10008.1.2.4.108 | Full |

## 5. Network Services

### 5.1 DICOMweb (Primary)

| Service | Method | Support |
|---|---|---|
| WADO-RS (Retrieve) | GET | Full |
| QIDO-RS (Query) | GET | Full |
| STOW-RS (Store) | POST | Full (SR, SEG) |
| WADO-URI | GET | Full |

### 5.2 Traditional DICOM Network

Not directly supported. The OHIF Viewer communicates via HTTP/REST (DICOMweb). Traditional DICOM network services (C-FIND, C-MOVE, C-STORE, C-ECHO) must be provided by the upstream PACS/archive.

## 6. Media Storage

| Capability | Support |
|---|---|
| Local file loading (drag-and-drop) | Full |
| DICOM Part 10 file reading | Full |
| DICOMjson manifest loading | Full |
| DICOMDIR reading | Not supported |

## 7. Structured Reporting

| Template | Support |
|---|---|
| TID 1500 — Measurement Report | Read + Write |
| TID 300 — Measurement | Read + Write |
| TID 1501 — Measurement and Qualitative Evaluations | Read |
| TID 2000 — Basic Diagnostic Imaging Report | Not supported |

### 7.1 Supported Measurement Types (TID 1500)

Length, Bidirectional, ArrowAnnotate, EllipticalROI, RectangleROI, CircleROI, PlanarFreehandROI, SplineROI, LivewireContour, Probe, Angle, CobbAngle.

## 8. Segmentation

| Capability | Support |
|---|---|
| Labelmap segmentation display | Full |
| Contour segmentation display | Full |
| Segmentation creation (labelmap) | Full |
| Segmentation creation (contour) | Full |
| Segmentation editing tools | Full |
| DICOM SEG export (STOW-RS) | Full |

## 9. Communication Profiles

| Profile | Support |
|---|---|
| HTTP/HTTPS (DICOMweb) | Full |
| TLS 1.2/1.3 | Full (via browser) |
| OpenID Connect (OIDC) | Full |
| Basic Authentication | Full |
| OAuth 2.0 Bearer Token | Full |

## 10. Rendering Capabilities

| Capability | Support |
|---|---|
| 2D image display | Full |
| Multiplanar Reconstruction (MPR) | Full |
| Maximum Intensity Projection (MIP) | Full |
| 3D Volume Rendering | Full |
| Cine playback | Full |
| Window/Level adjustment | Full |
| Zoom, Pan, Rotate | Full |
| Measurement tools | Full |
| Annotation tools | Full |

## 11. Character Set Support

| Character Set | Support |
|---|---|
| ISO_IR 192 (UTF-8) | Full |
| ISO_IR 100 (Latin-1) | Full |
| Default (ASCII) | Full |

## 12. Version History

| Version | Date | Changes |
|---|---|---|
| 3.13 | 2026-05 | Initial in-repository conformance statement |

---

*This conformance statement is maintained alongside the source code and updated with each release.*
