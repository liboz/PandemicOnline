# PandemicOnline

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 8.2.1.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).


off 
sudo swapoff -v /swapfile
sudo rm /swapfile

sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

permanent 
sudo nano /etc/fstab
/swapfile swap swap defaults 0 0

verify
sudo swapon --show


Next, remove the swap file entry /swapfile swap swap defaults 0 0 from the /etc/fstab file.

node --max_old_space_size=8192 node_modules/@angular/cli/bin/ng build --prod
sudo rm -r  /var/www/deploy/PandemicOnline
sudo cp dist/PandemicOnline  /var/www/deploy/ -r

sudo nano -c /etc/nginx/nginx.conf
sudo nano -c /var/log/nginx/access.log
sudo nano -c /var/log/nginx/error.log
sudo service nginx restart