// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'app.controllers'])

    .run(function ($ionicPlatform) {
        AV.initialize('fCIw80IiWeNtPgTjeLmyXmXa', 'rdEOJVEK8XrloWjEiaYF0yjT');
        $ionicPlatform.ready(function () {
            if (window.cordova && window.cordova.plugins.Keyboard) {
                // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                // for form inputs)
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

                // Don't remove this line unless you know what you are doing. It stops the viewport
                // from snapping when text inputs are focused. Ionic handles this internally for
                // a much nicer keyboard experience.
                cordova.plugins.Keyboard.disableScroll(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
        });
    })
    .config(function ($stateProvider, $urlRouterProvider,$ionicConfigProvider) {
        if(ionic.Platform.isAndroid()){
            $ionicConfigProvider.scrolling.jsScrolling(true);
        }
        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider

            .state('main', {
                url: '/main/data',
                templateUrl: 'templates/main.html',
                controller: 'mainCtrl'
            })
            .state('detail', {
                //url: '/detail/:achId',  // achievement id
                url: '/detail',  // achievement id
                abstract: true,
                templateUrl: 'templates/detail.html',
                controller: 'detailCtrl'
            })

            // Each tab has its own nav history stack:

            .state('detail.presentation', {
                url: '/presentation',
                templateUrl: 'templates/presentation.html',
                controller: 'preCtrl'

            })
            .state('detail.57109be339b057006ba9fbc9', {
                url: '/57109be339b057006ba9fbc9',
                templateUrl: 'presentations/57109be339b057006ba9fbc9.html',
                controller: 'preCtrl'
            })
            .state('detail.comments', {
                url: '/comments',
                templateUrl: 'templates/comments.html',
                controller: 'commentsCtrl'
            })
            .state('detail.likes', {
                url: '/likes',
                templateUrl: 'templates/likes.html',
                controller: 'likesCtrl'
            })
            .state('mentors', {
                url: '/mentors',

                templateUrl: 'templates/mentors.html',
                controller: 'mentorsCtrl'
            })
            .state('management', {
                url: '/management',
                cache:false,
                templateUrl: 'templates/management.html',
                controller: 'managementCtrl'
            })
            .state('management.ach', {
                url: '/ach',
                templateUrl: 'templates/achManage.html',
                controller: 'achManageCtrl'
            })
            .state('management.role', {
                url: '/role',
                templateUrl: 'templates/roleManage.html',
                controller: 'roleManageCtrl'
            });

        // if none of the above states are matched, use this as the fallback
        //$urlRouterProvider.otherwise('/management'); // for test
        //$urlRouterProvider.otherwise('/main/560b82a960b2492773eea827');// 测试导师// user info id // for test
        //$urlRouterProvider.otherwise('/main/5620588260b27457e844f787');// 观众// user info id // for test
        $urlRouterProvider.otherwise('/main/data?id=5620577760b22ed7ca856fb8');// 专业评委// user info id // for test
        //$urlRouterProvider.otherwise('/main');

    });