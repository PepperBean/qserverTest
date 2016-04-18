/**
 * Created by bin on 2016/4/12.
 */
var ctrlModule = angular.module('app.controllers', ['ionic', 'app.services', 'ngFileUpload', 'ksSwiper']);

ctrlModule.controller('appCtrl', function ($scope, $rootScope, $state) {

    AV.initialize('fCIw80IiWeNtPgTjeLmyXmXa', 'rdEOJVEK8XrloWjEiaYF0yjT');
    $scope.gotoMentors = function () {
        $state.go('mentors');
    };

    $scope.goHome = function () {
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
    , achSvr
    , roleSvr
    , userSvr
    , interActiveSvr
    , $timeout) {
    var myID = window.location.href.split('?').pop().split('=').pop();
    console.log(window.location.href);
    console.log(myID);
    $rootScope.userInfoId = $rootScope.userInfoId || myID;
    //$rootScope.userInfoId = $rootScope.userInfoId || $stateParams.uiid;
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
        }, function (err) {
            alert(JSON.stringify(err));
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
            interActiveSvr.like(ach, $rootScope.user).then(function () {
                $timeout(function () {
                    ach.alreadyLike = true;
                });
                q.resolve();
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
        //$state.go('detail.' + $rootScope.ach.id);
        $state.go('detail.presentation');
    }

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
                //$state.go('detail.' + $rootScope.ach.id);
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
            _.every($rootScope.mentors, function (m) {
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

ctrlModule.controller('preCtrl', function ($scope, $rootScope) {
    $scope.$on('$ionicView.beforeEnter', function () {
        $rootScope.activeIndex = 0;
    });
    //$scope.$on('$ionicView.afterEnter', function () {
    //    $scope.preUrl = 'presentations/' + $rootScope.ach.id + '.html';
    //})
});

ctrlModule.controller('commentsCtrl', function ($scope, $rootScope, interActiveSvr, $timeout) {
    $scope.$on('$ionicView.beforeEnter', function () {
        $rootScope.activeIndex = 1;
        $scope.dynHeight = {
            height: '500px'
        };
    });

    $scope.$on('$ionicView.enter', function () {
        $scope.$parent.refreshmCommnets();
        $scope.$parent.refreshCommnets();
    })
});

ctrlModule.controller('likesCtrl', function ($scope, $rootScope) {
    $scope.$on('$ionicView.beforeEnter', function () {
        $rootScope.activeIndex = 2;
    })
    $scope.$on('$ionicView.enter', function () {
        $scope.$parent.refreshLikes();
    })
});

ctrlModule.controller('mentorsCtrl', function ($scope) {

});

ctrlModule.controller('managementCtrl', function ($scope, userSvr, $state) {
    $state.go('management.ach');
});

ctrlModule.controller('achManageCtrl', function ($scope, $timeout, achSvr) {

    $scope.newAchInfo = {
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