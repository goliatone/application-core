### TODO

- [ ] Add documentation and a tutorial for how to create a new project template
- [ ] make core.io cli tool use simple-project-generator, and by default install the core.io-starter-template
- [ ] Add generators to core.io cli. Make a new cli module to read from a directory and copy to a target dir, we can then list the generators, and execute one on demand.
- [ ] Add a Taskfile to the core.io-starter-template
- [ ] Add option to `core.io new <project>` to take no prompt and make a sample project.

When we install a project template it might carry some generators which are relevant in a given project type. We should be able to read the project type in a directory. So, core.io CLI should generate and manage metadata for a project. i.e. which template it used, which version. Which generators are included, etc.
