# Security Policy

## Supported content

This repository contains documentation and a dependency-free algorithm example. It is not a hosted service and does not process a production corpus.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting feature for this repository. Do not open a public issue containing credentials, private documents, exploit payloads, or customer data.

Include:

- affected file and revision;
- impact and realistic attack conditions;
- minimal reproduction using synthetic data;
- suggested mitigation, if known.

## Deployment warning

The reference patterns are not a security boundary by themselves. Before exposing a RAG application to a network, add authentication, tenant-aware authorization, upload isolation, rate limits, audit logging, output sanitization, and a threat model for prompt injection and data exfiltration.
