---
title: "Environments"
date: "2017-12-20"
template: "index"
---

## Supporting Different Environments

Another aspect in which **core.io** tries to simplify the configuration process is by _how_ it supports different development environments, like **staging**, **development**, **production**, etc.

In short: _it does not_.

To be more precise, **core.io** takes a very pragmatic stance and does not provide any way to (directly) manage different environments but has some _recommendations_ that make having configuration files per environment unnecessary.

A lot of the things that need to change on each environment are _secrets_ like service tokens or user keys. We chose to manage those by using `process.env` and environment variables.

If you use the provided `Application.loadConfig` then your configuration files are javascript files which, obviously, can have logic in it. Meaning that you can check the value of `process.env.NODE_ENV` and export different objects based on that value.

Another benefit of `Application.loadConfig` is that you can reference other parts of your configuration files and solve them at runtime, making your configuration files modular.

You can also make use of the `afterSolver` facility which gets access to the merged configuration object. In it you can access the `environment` key which holds the value of the current environment and modify your configuration file at runtime.

Case in point, you have options.

Ideally your configuration files should be logic lightweight in order to reduce possible errors and keep things simple, but you are free to do as you please.

You can also use an environment manager like [envset][envset] to dynamically populate your `process.env` variables. All you need is an `.envset` file where you define your environments, environment variables and their values:

```
[production]
NODE_AWS_SECRET_ACCESS_KEY=FS40N0QY22p2bpciAh7wuAeHjJURgXIBQ2cGodpJD3FRjw2EyYGjyXpi73Ld8zWO
NODE_AWS_ACCESS_KEY_ID=LSLhv74Q1vH8auQKUt5pFwnix0FUl0Ml
NODE_HONEYBADGER_KEY=LCgZgqsxKfhO
NODE_POSTGRES_ENDPOINT=50.23.54.25
NODE_POSTGRES_DATABASE=myproject
NODE_POSTGRES_PSWD=Pa$sW03d
NODE_POSTGRES_USER=myproject

[development]
NODE_AWS_SECRET_ACCESS_KEY=HN5ITok3lDaA1ASHxtEpy1U9XCjZwThmfgoIYZk8bkOqc5yk6sT7AWd3ooNeRFV9
NODE_AWS_ACCESS_KEY_ID=m35W4PGGVZfj1gOxYvztFxBD5F2605B3
NODE_HONEYBADGER_KEY=f3MNPUhZoki6
NODE_POSTGRES_ENDPOINT=localhost
NODE_POSTGRES_DATABASE=postgres
NODE_POSTGRES_PSWD=postgres
NODE_POSTGRES_USER=postgres
```


**NOTE**: If you use `.envset` remember to add it to your `.gitignore` file.

Lastly but more importantly, you can **BYOS**- bring your own solution- and use whatever configuration system you prefer.

**TIP:** To manage different environments you can always use [envset][envset]:

```
$ envset development -- npm start
```
