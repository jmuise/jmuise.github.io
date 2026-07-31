FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        openssh-client \
        rsync \
        make \
        build-essential \
        nodejs \
        npm \
    && rm -rf /var/lib/apt/lists/*

# Install Hugo Extended for the current architecture, pinned to the same
# version used by .github/workflows/hugo.yml so local builds match CI.
ARG HUGO_VERSION=0.164.0
RUN set -eux; \
    arch="$(dpkg --print-architecture)"; \
    case "${arch}" in \
      amd64) hugo_arch="amd64" ;; \
      arm64) hugo_arch="arm64" ;; \
      *) echo "Unsupported architecture: ${arch}"; exit 1 ;; \
    esac; \
    curl -fsSL -o /tmp/hugo.deb "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-${hugo_arch}.deb"; \
    apt-get update; \
    apt-get install -y --no-install-recommends /tmp/hugo.deb; \
    rm -f /tmp/hugo.deb; \
    rm -rf /var/lib/apt/lists/*
