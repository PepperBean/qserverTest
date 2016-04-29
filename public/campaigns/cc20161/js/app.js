// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'app.controllers'])

    .run(function ($ionicPlatform) {
        // qsshow *************
        AV.initialize('q8hYvyi3O9PWoLc8HrgD3oh3', 'YWyuQDG8Oy3bgvEKxKgnXwJy');
        // dev **************
        // AV.initialize('fCIw80IiWeNtPgTjeLmyXmXa', 'rdEOJVEK8XrloWjEiaYF0yjT');
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
        $ionicConfigProvider.templates.maxPrefetch(0);
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
            // pre start+++++++++++++++++++++++++
            .state('detail.p1', {
                url: '/p1',
                templateUrl: 'presentations/p1.html',
                controller: 'preCtrl'
            })
            .state('detail.p2', {
                url: '/p2',
                templateUrl: 'presentations/p2.html',
                controller: 'preCtrl'
            })
            .state('detail.p3', {
                url: '/p3',
                templateUrl: 'presentations/p3.html',
                controller: 'preCtrl'
            })
            .state('detail.p4', {
                url: '/p4',
                templateUrl: 'presentations/p4.html',
                controller: 'preCtrl'
            })
            .state('detail.p5', {
                url: '/p5',
                templateUrl: 'presentations/p5.html',
                controller: 'preCtrl'
            })
            .state('detail.p6', {
                url: '/p6',
                templateUrl: 'presentations/p6.html',
                controller: 'preCtrl'
            })
            .state('detail.p7', {
                url: '/p7',
                templateUrl: 'presentations/p7.html',
                controller: 'preCtrl'
            })
            .state('detail.p8', {
                url: '/p8',
                templateUrl: 'presentations/p8.html',
                controller: 'preCtrl'
            })
            .state('detail.p9', {
                url: '/p9',
                templateUrl: 'presentations/p9.html',
                controller: 'preCtrl'
            })
            .state('detail.p10', {
                url: '/p10',
                templateUrl: 'presentations/p10.html',
                controller: 'preCtrl'
            })
            .state('detail.p11', {
                url: '/p11',
                templateUrl: 'presentations/p11.html',
                controller: 'preCtrl'
            })
            .state('detail.p12', {
                url: '/p12',
                templateUrl: 'presentations/p12.html',
                controller: 'preCtrl'
            })
            .state('detail.p13', {
                url: '/p13',
                templateUrl: 'presentations/p13.html',
                controller: 'preCtrl'
            })
            .state('detail.p14', {
                url: '/p14',
                templateUrl: 'presentations/p14.html',
                controller: 'preCtrl'
            })
            // pre end+++++++++++++++++++++++++
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
        //$urlRouterProvider.otherwise('/main/560b82a960b2492773eea827');// ���Ե�ʦ// user info id // for test
        // $urlRouterProvider.otherwise('/main/5620588260b27457e844f787');// ����// user info id // for test
        $urlRouterProvider.otherwise('/main/data?id=5620588260b27457e844f787');// רҵ��ί// user info id // for test
        //$urlRouterProvider.otherwise('/main');

    });