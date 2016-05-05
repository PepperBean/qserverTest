/**
 * Created by bin on 2016/4/12.
 */
var ctrlModule = angular.module('app.controllers', ['ionic', 'app.services', 'ngFileUpload', 'ksSwiper']);

ctrlModule.controller('appCtrl', function ($scope, $rootScope, $state,$ionicHistory) {
    $scope.gotoMentors = function () {
        $state.go('mentors');
    };

    $scope.goHome = function () {
        // $ionicHistory.nextViewOptions({
        //     // disableAnimate: true,
        //     disableBack: true,
        //     historyRoot: true
        // });
        $state.go('main');
    };

    $rootScope.$on('$stateChangeStart',
        function (event, toState, toParams, fromState, fromParams) {
            $rootScope.hideGoHome = toState.name === 'main'
        });
});

ctrlModule.controller('mainCtrl', function ($scope, $rootScope
    , $state
    , $stateParams
    , $q
    , $window
    , $ionicPopup
    , $ionicHistory
    , achSvr
    , roleSvr
    , userSvr
    , interActiveSvr
    , $timeout) {


    //   yesir 2016/4/12 10:22:35
    //   AV.initialize('q8hYvyi3O9PWoLc8HrgD3oh3', 'YWyuQDG8Oy3bgvEKxKgnXwJy');

    //var url = window.location.search;
    //var match = url.match(/\?id=([0-9a-z]{24})/);
    // var url = '1.2.3/data?id=5603a807ddb255edbff26fab';
    // var match = url.match(/data\?id=([0-9a-z]{24})/);
    //var myID = match[1];
    var myID = window.location.href.split('?').pop().split('=').pop();
    console.log(window.location.href);
    console.log(myID);
    $rootScope.userInfoId = $rootScope.userInfoId || myID;
    if (!$rootScope.user) {
        userSvr.getUserInfo($rootScope.userInfoId).then(function (user) {
            if (!!user) {
                $rootScope.user = user;
            }
            else {
                alert('用户错误');
            }
        }, function (err) {
            alert('用户错误');
        });
    }


    if (!$rootScope.roleType) {
        roleSvr.getRoleType($rootScope.userInfoId).then(function (rt) {
            $rootScope.roleType = rt;
        });
    }


    // $scope.$on('$ionicView.afterEnter', function () {
    //     $ionicHistory.clearHistory();
    // });
    $scope.$on('$ionicView.enter', function () {
        achSvr.getAllAchs().then(function (achs) {
            $scope.achs = achs;
            $timeout(function () {
                $scope.achs = _.map(achs, function (a) {
                    interActiveSvr.checkAlreadyLike(a, $rootScope.userInfoId).then(function (r) {
                        a.alreadyLike = r;
                    });
                    return a;
                });
            });
        });
        roleSvr.getAllRoles('1').then(function (ms) {
            $rootScope.mentors = ms;

        }, function (err) {
            alert(err)
        })
    });

    $rootScope.toggleLike = function (ach) {
        var q = $q.defer();
        if (ach.alreadyLike) {
            interActiveSvr.undoLike(ach, $rootScope.user).then(function () {
                $timeout(function () {
                    ach.alreadyLike = false;
                });
                q.resolve();
            });
        }
        else {
            interActiveSvr.like(ach, $rootScope.user, $rootScope.roleType).then(function () {
                $timeout(function () {
                    ach.alreadyLike = true;
                });
                q.resolve();
            }, function (err) {
                $ionicPopup.alert({
                    title: err
                });
            });
        }
        return q.promise;
    };

    $scope.comment = function (ach) {
        $rootScope.ach = ach;
        $state.go('detail.comments');
    };

    $scope.gotoAchDetail = function (ach) {
        $rootScope.ach = ach;
        // $state.go('detail.p' + $rootScope.ach.get('index'));
        $state.go('detail.presentation');
    };
    var height = $window.innerHeight;
    $rootScope.dynHeight = {
        height: height + 'px'
    };

});

ctrlModule.controller('detailCtrl', function ($scope, $rootScope
    , $state, $timeout
    , $ionicPopup, interActiveSvr) {
    $rootScope.activeIndex = 0;
    $timeout(function () {
        $rootScope.countLikes = 0;
        $rootScope.countComments = 0;
        $rootScope.comments = [];
    });

    $scope.refreshLikes = function () {
        interActiveSvr.getAllLikes($rootScope.ach).then(function (likes) {
            $timeout(function () {
                $rootScope.likes = likes;
            });
        })
    };

    $scope.$on('$ionicView.enter', function () {
        interActiveSvr.countLikes($rootScope.ach).then(function (c) {
            $timeout(function () {
                $rootScope.countLikes = c;
            });
        });
        interActiveSvr.countComments($rootScope.ach).then(function (c) {
            $timeout(function () {
                $rootScope.countComments = c;
            })
        });

        $scope.refreshLikes();
    });


    $scope.changeIndex = function (index) {
        $rootScope.activeIndex = index;
        switch (index) {
            case 0 :
                // $state.go('detail.p' + $rootScope.ach.get('index'));
                $state.go('detail.presentation');
                break;
            case 1:
                $state.go('detail.comments');
                break;
            case 2:
                $state.go('detail.likes');
                break;
        }
    };
    $scope.comment = function () {
        $scope.data = {};
        $ionicPopup.show({
            title: '请输入评论：',
            template: '<textarea ng-model="data.mes" name="a" style="position:relative;left: 5%;width:90%;height:80px;resize: none"></textarea>',
            scope: $scope,
            buttons: [
                {text: '取消'},
                {
                    text: '<b>发表</b>',
                    type: 'button-positive',
                    onTap: function (e) {
                        return $scope.data.mes;
                    }
                }
            ]
        }).then(function (res) {
            if (!!res) {
                interActiveSvr.addComment(res, $rootScope.userInfoId, $rootScope.ach)
                    .then(function () {
                        if ($state.current.name === 'detail.comments') {
                            if ($rootScope.roleType === 1) {
                                $scope.refreshmCommnets();
                            } else {
                                $scope.refreshCommnets();
                            }
                        }
                        if ($rootScope.roleType !== 1) {
                            interActiveSvr.countComments($rootScope.ach).then(function (c) {
                                $timeout(function () {
                                    $rootScope.countComments = c;
                                });
                            });
                        }
                    }, function (err) {
                        alert(JSON.stringify(err));
                    });
            }
        });
    };
    $scope.refreshCommnets = function () {
        interActiveSvr.getAllComments($rootScope.ach).then(function (cs) {
            $timeout(function () {
                $rootScope.comments = cs;
            });
        }, function (err) {
            if (err.code != 101)alert(err);
        })
    };
    $scope.refreshmCommnets = function () {
        interActiveSvr.getAllmComments($rootScope.ach).then(function (mcs) {
            _.forEach($rootScope.mentors, function (m) {
                var tm = _.find(mcs, function (cm) {
                    return cm.get('userInfo').id === m.get('userInfo').id;
                });
                $timeout(function () {
                    m.comment = tm;
                });
            });
        }, function (err) {
            if (err.code != 101)alert(err);
        })
    };

    $scope.toggleLike = function () {
        $rootScope.toggleLike($rootScope.ach).then(function () {
            interActiveSvr.countLikes($rootScope.ach).then(function (c) {
                $timeout(function () {
                    $rootScope.countLikes = c;
                });
            });
            $scope.refreshLikes();
        });
    };
});

ctrlModule.controller('preCtrl', function ($scope, $rootScope, $state, $timeout, $ionicLoading, $ionicHistory) {
    $scope.$on('$ionicView.afterEnter', function () {
        $rootScope.activeIndex = 0;
        if ($state.current.name === 'detail.presentation') {
            $ionicHistory.nextViewOptions({
                disableAnimate: true,
                disableBack: true,
                historyRoot: false
            });
            $timeout(function () {
                $state.go('detail.p' + $rootScope.ach.get('index'));
                $ionicLoading.show({
                    template: '正在加载...'
                });
            }, 200);
        }
    });


    $scope.$on('$ionicView.beforeLeave', function () {
        $ionicLoading.hide();
    })
});

ctrlModule.controller('commentsCtrl', function ($scope, $rootScope) {
    $scope.$on('$ionicView.beforeEnter', function () {
        $rootScope.activeIndex = 1;
    });

    $scope.$on('$ionicView.enter', function () {
        $scope.$parent.refreshmCommnets();
        $scope.$parent.refreshCommnets();
    });
    $scope.deleteComment = function (c) {
        c.destroy().then(function () {
            $scope.$parent.refreshCommnets();
        })
    }
});

ctrlModule.controller('likesCtrl', function ($scope, $rootScope) {
    $scope.$on('$ionicView.beforeEnter', function () {
        $rootScope.activeIndex = 2;
    });
    $scope.$on('$ionicView.enter', function () {
        $scope.$parent.refreshLikes();
    })
});

ctrlModule.controller('mentorsCtrl', function ($scope, userSvr) {

    $scope.mentorsInfo = [
        {
            imgPath: "./img/mentor1.jpg",
            mentorId: "561f64c500b07c4da6be1503"
            ,  // 许磊
            domain: "产品创新、资源整合，创新推广",
            slogen: "只有想不到，没有做不到",
            contact: "58596541/13512951228 (手机号可加微信)"

        },
        {
            imgPath: "./img/mentor2.jpg",
            mentorId: "56270074ddb2084ab0eebda6"
            ,  // 张风柱
            domain: "软硬件研发，产品设计",
            slogen: "用最专业的技术知识，找出带给我感受最好的创新成果",
            contact: "58596558/13682192958 (手机号可加微信)"
        },
        {
            imgPath: "./img/mentor3.jpg",
            mentorId: "5631dc1e60b25b79325e2885"
            ,  // 刘中胜
            domain: "产品策划、整合推广",
            slogen: "只有行动才可能有结果，不行动什么也没有，重要的是行动、行动、行动，重要的事情说三遍",
            contact: "58596585/13388023769 (手机号可加微信)"
        },
        {
            imgPath: "./img/mentor4.jpg",
            mentorId: "563723a060b25b7932c26152"
            , //  马红娟
            domain: "管理创新的亮点挖掘,应用效果展示",
            slogen: "感受创新，用“新”体会",
            contact: "58596571/13820854471 (手机号可加微信)"
        }
        ,
        {
            imgPath: "./img/mentor5.jpg",
            mentorId: "56306c1800b0d1dbddef4d26"
            ,  // 胡雅秋
            domain: "咨询相关",
            slogen: "给我一个1，还你一个N。让我们一起发现小创新背后的N种价值",
            contact: "58089311/18602256473 (手机号可加微信)"
        }
    ];
    $scope.headPW = {
        width: 100 / $scope.mentorsInfo.length + '%'
    };
    // 导师界面默认信息
    // 详情信息待更新。
    userSvr.getUserInfo($scope.mentorsInfo[2].mentorId)
        .then(function (user) {
            if (!!user) {
                $scope.selectedMentor = user;
                $scope.selectedMentor.info = $scope.mentorsInfo[2];
                $scope.lastIndex = 2;
                $scope.selectedM = 2;
            }
            else {
                alert('导师信息错误');
            }
        }, function (err) {
            alert('导师信息错误');
        });
    // 点击重新筛选信息
    // 详情待更新
    $scope.GetMentorInfo = function (index) {
        if ($scope.lastIndex != index) {
            $scope.selectedM = index;
            userSvr.getUserInfo($scope.mentorsInfo[index].mentorId)
                .then(function (user) {
                    if (!!user) {
                        $scope.$apply(function () {
                            $scope.selectedMentor = user;
                            $scope.selectedMentor.info = $scope.mentorsInfo[index];
                            $scope.lastIndex = index;
                        })
                    }
                    else {
                        alert('导师信息错误');
                    }
                }, function (err) {
                    alert('导师信息错误');
                });
        }
    }
});


ctrlModule.controller('managementCtrl', function ($scope, userSvr, $state) {
    $state.go('management.ach');
});

ctrlModule.controller('achManageCtrl', function ($scope, $timeout, achSvr) {

    $scope.newAchInfo = {
        index: 0,
        title: "",
        members: "",
        catalog: "",
        posterUrl: ""
    };
    $scope.$on('$ionicView.enter', function () {
        achSvr.getAllAchs().then(function (achs) {
            $timeout(function () {
                $scope.achs = achs;
            });
        })
    });
    $scope.onFileSelect = function (file) {
        if (file === null) {
            $scope.newAchInfo.posterUrl = "";
            return;
        }
        var fr = new FileReader();
        fr.onload = function (e) {
            var b64 = e.target.result;
            $scope.newAchInfo.posterUrl = b64;
        };
        fr.readAsDataURL(file);
    };


    $scope.addAch = function () {
        achSvr.saveAch($scope.newAchInfo).then(function () {
            achSvr.getAllAchs().then(function (achs) {
                $timeout(function () {
                    $scope.achs = achs;
                });
            })
        });
    };
    $scope.delAch = function (a) {
        achSvr.delAch(a).then(function () {
            achSvr.getAllAchs().then(function (achs) {
                $timeout(function () {
                    $scope.achs = achs;
                    $scope.cancel();
                });
            })
        });
    };


    $scope.cancel = function () {
        $scope.newAchInfo = {
            title: "",
            members: "",
            catalog: "",
            posterUrl: ""
        }
    }
});

ctrlModule.controller('roleManageCtrl', function ($scope, roleSvr, $timeout, userSvr) {
    $scope.roles = [];
    $scope.$on('$ionicView.enter', function () {
        roleSvr.getAllRoles().then(function (roles) {
            $timeout(function () {
                $scope.roles = roles;
            });
        })
    });
    $scope.addRole = function (rType) {
        roleSvr.addRole({
            user: $scope.selecedtUser,
            role: rType
        }).then(function () {
            roleSvr.getAllRoles().then(function (roles) {
                $timeout(function () {
                    $scope.roles = roles;
                });
            });

        }, function (err) {
            alert(JSON.stringify(err));
        })
    };
    $scope.delRole = function (r) {
        roleSvr.delRole(r).then(function () {
            roleSvr.getAllRoles().then(function (roles) {
                $timeout(function () {
                    $scope.roles = roles;
                });
            });
        })
    };

    // -------------------- search logic -----------------------------
    $scope.searchInfo = {};
    $scope.$watch('searchInfo.text', function (v, oldVal, scope) {

        if (!v) {
            $scope.foundUsers = [];
            $timeout.cancel(tId);
            return;
        }
        _throttle(function (sv) {
            userSvr.searchUserInfo(sv).then(function (users) {
                if ($scope.foundUsers && $scope.foundUsers.length != 0) {
                    var same = _.every($scope.foundUsers, function (fu) {
                        return _.find(users, ['id', fu.id]);
                    });
                    if (same) {
                        return;
                    }
                }
                $scope.foundUsers = [];
                $timeout(function () {
                    $scope.foundUsers = users;
                }, 300);
            }, function () {
                $scope.foundUsers = [];
            });
        }, v);
    });

    var tId;

    function _throttle(method, para) {
        $timeout.cancel(tId);
        tId = $timeout(function () {
            method(para);
        }, 800);
    };
    $scope.selectUser = function (ui) {
        $scope.searchInfo.text = ui.get('name');
        $scope.foundUsers = [];
        $scope.selecedtUser = ui;
    }
});
