IMAGE := node:20-alpine
WORKDIR := /app

## Detect container engine (podman or docker)
CONTAINER_ENGINE := $(shell command -v podman 2>/dev/null || command -v docker 2>/dev/null)

# Use :Z bind-mount option only with Podman (SELinux relabeling)
ifneq (,$(findstring podman,$(CONTAINER_ENGINE)))
MOUNT_OPT := :Z
endif

VOLUME := -v $(PWD):$(WORKDIR)$(MOUNT_OPT)

.PHONY: shell test lint install clean

install:
ifdef CONTAINER_ENGINE
	$(CONTAINER_ENGINE) run --rm $(VOLUME) -w $(WORKDIR) $(IMAGE) npm install
else
	npm install
endif

test:
ifdef CONTAINER_ENGINE
	$(CONTAINER_ENGINE) run --rm $(VOLUME) -w $(WORKDIR) $(IMAGE) npx mocha
else
	npx mocha
endif

lint:
ifdef CONTAINER_ENGINE
	$(CONTAINER_ENGINE) run --rm $(VOLUME) -w $(WORKDIR) $(IMAGE) npx eslint .
else
	npx eslint .
endif

shell:
ifdef CONTAINER_ENGINE
	$(CONTAINER_ENGINE) run --rm -it $(VOLUME) -w $(WORKDIR) $(IMAGE) sh
else
	@echo "no container engine available"
endif

clean:
	rm -rf node_modules
