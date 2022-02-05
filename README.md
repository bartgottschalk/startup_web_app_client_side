# Note 
I no longer control the domain startupwebapp.com and am not responsbile for the content that is currently served from that domain. Use caution if you go there. 

# startup_web_app_client_side
I'm co-founder of a startup which

1. Produces and sells a relatively small quantity of a relatively high number of customizable physical products, and
2. Has future plans to build a complementary digital product. 

Soon after jumping into this idea it was clear we would need a web application to support our product's discovery, selection, customization, purchase and interactive experiences. We looked at using existing marketplaces and web-site building platforms such as Squarespace or Wix. These didn't work for us for a couple of reasons

1. The customizable nature of our products
2. The large number of individual skus we would be managing
3. Our customers can create skus dynamically.

This made using “off-the-shelf” solutions unworkable, even for early prototyping and experimentation, and meant we needed to build a custom web application. Among our non-functional requirements were things like

1. The ability to iterate quickly
2. Security
3. Reliability
4. Support growth and scalability (reasonably)
5. Support future iterative exploration of our digital product
6. Can’t be so costly that it sinks the business. 

As the only technical co-founder, it landed on me to "figure this out." 

This repository contains a simplified version of the server side application I built to launch our startup. To learn more about this project you can check out [slides from a talk I gave about the technical aspects of this project](https://docs.google.com/presentation/d/18Y_G3asKbeys7s5618N_VJkXCI0ePwJ0vKB_06c-P3w/edit#slide=id.g5820c97b01_0_114) or [slides from a talk I gave demoing use of the project for startup idea validation](https://docs.google.com/presentation/d/1O80AyN6jpFxfooDz8ILfYE1PyYlm917mP2EqYuMf5SE/edit#slide=id.g5820c97b01_0_90).

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for experimentation and/or development purposes.

### Prerequisites

#### For the static web application to function

- A webserver such as [Apache](https://httpd.apache.org/docs/2.4/install.html) or [Nginx](https://www.nginx.com/resources/wiki/start/topics/tutorials/install/)

#### For the Qunit tests to run in PhantomJS
- [nodejs](https://nodejs.org/en/download/package-manager/)
- [npm](https://www.npmjs.com/get-npm)
- [phantomjs-prebuilt](https://www.npmjs.com/package/phantomjs-prebuilt)
- [qunit-phantomjs-runner](https://www.npmjs.com/package/qunit-phantomjs-runner)
- [unit.js](https://unitjs.com/guide/quickstart.html)
- [jquery](https://www.npmjs.com/package/jquery)
- [qunit](https://www.npmjs.com/package/qunit)
- [node-qunit](https://www.npmjs.com/package/node-qunit)

### Installing the Application

#### Install from Github
Note: These instructions assume that you will install the application at `~/StartupWebApp`. If you select another location you will need to adjust all other commands accordingly.  

```
cd ~/StartupWebApp
git clone https://github.com/bartgottschalk/startup_web_app_client_side.git
cd ~/StartupWebApp/startup_web_app_client_side
```

#### Web Server Setup
Configure Apache, Nginx or other webserver to serve 
- localhost.startupwebapp.com from `~/StartupWebApp/startup_web_app_client_side`
- localliveservertestcase.startupwebapp.com from `~/StartupWebApp/startup_web_app_client_side` (this is needed for Selenium functional tests)

Note: The function $.env_vars in `~/StartupWebApp/startup_web_app_client_side/js/index.0.0.1.js` needs to be updated if you don't host the applcation locally at `http://localhost.startupwebapp.com/` and the api locally at `http://localapi.startupwebapp.com`

#### Configure Hosts File
Configure hosts file to route urls to local
- local.startupwebapp.com to 127.0.0.1
- localliveservertestcase.startupwebapp.com to 127.0.0.1 (this will be used to run Selenium functional tests)

#### Test that the static website is responding: 
Go to http://localhost.startupwebapp.com/
Expected result: Displays the static home page. Note: if the API is inaccessible there will be errors loading the page and some functinoality will not work. 

## Running tests

This application contains Qunit JavaScript unit tests.

### Run QUnit test in phantomjs
From the Command Line:
```
phantomjs /usr/local/lib/node_modules/qunit-phantomjs-runner/runner.js ~/StartupWebApp/startup_web_app_client_side/unittests/index_tests.html
```

In Browser: 
Go to http://localhost.startupwebapp.com/unittests/index_tests.html

## Authors

* **Bart Gottschalk** - *Initial work* - [BartGottschalk](https://github.com/BartGottschalk)

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE.md](LICENSE.md) file for details
