/**
 * Created by bin on 2016/4/12.
 */
var serviceModule = angular.module('app.services', []);

serviceModule.factory('modelSvr', function () {
    var campaignPrefix = 'camp_cc20161_';
    var role = AV.Object.extend(campaignPrefix + 'role');
    var achievement = AV.Object.extend(campaignPrefix + 'achievement');
    var likes = AV.Object.extend(campaignPrefix + 'likes');
    var comments = AV.Object.extend(campaignPrefix + 'comments');
    var mComments = AV.Object.extend(campaignPrefix + 'mComments');
    var userInfo = AV.Object.extend('UserInfo');

    return {
        role: role,
        ach: achievement,
        likes: likes,
        comments: comments,
        mComments: mComments,
        userInfo: userInfo
    }
});

serviceModule.factory('roleSvr', function ($q, modelSvr) {

    var allRoleCach = null;
    var rolesDirty = true;

    function _getRoleByInfoId(userid) {
        var q = $q.defer();
        _getAllRoles().then(function (roles) {
            var role = _.find(roles, function (r) {
                return r.get('userInfo').id === userid;
            });
            q.resolve(role);
        }, function (err) {
            q.reject(err);
        });
        return q.promise;
    }

    function _getRoleType(userId) {
        var q = $q.defer();
        _getRoleByInfoId(userId).then(function (r) {
            if (!!r) {
                q.resolve(parseInt(r.get('roleType')));
            }
            else {
                q.resolve(0);
            }
        }, function () {
            q.resolve(0);
        });
        return q.promise;
    }

    function _isRole(userid, roleType) {
        var q = $q.defer();
        _getRoleByInfoId(userid).then(function (role) {
            var rt = (!!role) ? role.get('roleType') : 0;
            q.resolve(rt === roleType);
        }, function (err) {
            q.reject(err);
        });
        return q.promise;
    }

    function _isAdmin(userid) {
        return _isRole(userid, 0);
    }

    function _isMentor(userid) {
        return _isRole(userid, 1);
    }

    function _isJudge(userid) {
        return _isRole(userid, 2);

    }

    function _addRole(info) {
        // 一共三种角色：观众:0（不记录），导师（mentor:1），专业评委（judge：2）,admin:3

        var q = $q.defer();
        var role = new modelSvr.role();
        role.set('userInfo', info.user);
        role.set('roleType', info.role);
        role.save().then(function () {
            rolesDirty = true;
            q.resolve();
        }, function () {
            q.reject();
        });

        return q.promise;

    }

    function _delRole(role) {
        rolesDirty = true;
        return role.destroy();
    }

    function _getAllRoles(roleType) {

        var q = $q.defer();
        $q(function (rev, rej) {
            if (rolesDirty) {
                var query = new AV.Query(modelSvr.role);
                query.include('userInfo');
                query.find().then(function (roles) {
                    rolesDirty = false;
                    allRoleCach = roles;
                    rev(roles);
                }, function (err) {
                    rev([]);
                });
            }
            else {
                rev(allRoleCach);
            }
        }).then(function (allRoles) {
            if (roleType === undefined) {
                q.resolve(allRoles);
            }
            else {
                var rs = _.filter(allRoles, function (r) {
                        return r.get('roleType') === roleType;
                    }
                );
                q.resolve(rs);
            }
        }, function (err) {
            q.reject(err);
        });

        return q.promise;
    }

    return {
        isAdmin: _isAdmin,
        isMentor: _isMentor,
        isJudge: _isJudge,
        getRoleByInfoId: _getRoleByInfoId,
        getRoleType: _getRoleType,
        addRole: _addRole,
        getAllRoles: _getAllRoles,
        delRole: _delRole

    }
});

serviceModule.factory('achSvr', function ($q, modelSvr) {

    function _saveAchievements(info) {
        var q = $q.defer();
        var ach = new modelSvr.ach();
        ach.set('title', info.title);
        ach.set('members', info.members);
        ach.set('catalog', info.catalog);


        var poster = new AV.File('poster', {base64: info.posterUrl});
        ach.set('poster', poster);
        ach.save().then(function (ach) {
            q.resolve(ach);
        }, function (err) {
            q.reject(err);
        });
        return q.promise;
    }

    function _getAllAchs() {
        var query = new AV.Query(modelSvr.ach);
        //query.include('poster');
        return query.find();
    }

    function _delAch(ach) {
        return ach.destroy();
    }

    return {
        getAllAchs: _getAllAchs,
        saveAch: _saveAchievements,
        delAch: _delAch
    }
});

serviceModule.factory('userSvr', function ($q, roleSvr, modelSvr) {

    function _adminLogin(u, p) {
        var q = $q.defer();
        var query = new AV.Query(AV.User);
        query.equalTo('username', u);
        query.first().then(function (user) {
            roleSvr.isAdmin(user).then(function () {
                AV.User.logIn(u, p);
                q.resolve(user);
            }, function () {
                q.reject('不是管理员');
            })

        }, function (err) {
            q.reject('查询失败');

        });
        return q.promise;
    }

    function _searchUsers(name) {
        var q = $q.defer();
        var query1 = new AV.Query(modelSvr.userInfo);
        query1.contains('name', name);
        query1.ascending('name');
        //var query2 = new AV.Query('_User');
        ////query2.equalTo('username', info);
        //query2.contains('username', info);

        //var query = new AV.Query.or(query1, query2);
        //query.ascending('nickname');
        //query.notEqualTo('objectId', AV.User.current().id);
        query1.find().then(function (users) {
            q.resolve(users);
        });
        return q.promise;
    }

    return {
        getUserInfo: function (uid) {
            var query = new AV.Query('UserInfo');

            return query.get(uid);

        },
        adminLogin: _adminLogin,
        searchUserInfo: _searchUsers

    }
});

serviceModule.factory('interActiveSvr', function ($q, modelSvr, roleSvr) {

    var currentUserLikes = null;
    var currentUserLikesDirty = true;

    function _like(ach, user, roleType) {

        if (roleType&&roleType == 2) {
            return _judgerLike(ach, user);
        }

        var q = $q.defer();
        var like = new modelSvr.likes();
        like.set('liker', user);
        //like.fetchWhenSave(true);
        like.set('ach', ach);
        like.save().then(function () {
            currentUserLikesDirty = true;
            q.resolve();
        }, function (err) {
            q.reject(err);
        });

        return q.promise;
    }

    function _judgerLike(ach, judger) {
        var q = $q.defer();
        var query = new AV.Query(modelSvr.likes);
        query.equalTo('liker', judger);
        query.count().then(function (n) {
            if (n >= 3) {
                q.reject('对不起，专业评委只能点赞3次');
            }
            else {
                var like = new modelSvr.likes();
                like.set('liker', judger);
                //like.fetchWhenSave(true);
                like.set('ach', ach);
                like.save().then(function () {
                    currentUserLikesDirty = true;
                    q.resolve();
                }, function (err) {
                    q.reject(err);
                });
            }
        });
        return q.promise;
    }

    function _undoLike(ach, user) {
        var q = $q.defer();
        var query = new AV.Query(modelSvr.likes);
        query.equalTo('ach', ach);
        query.equalTo('liker', user);
        query.find().then(function (likes) {
            AV.Object.destroyAll(likes).then(function () {
                currentUserLikesDirty = true;
                q.resolve();
            }, function (err) {
                q.reject(err);
            })
        }, function (err) {
            q.reject(err);
        });
        return q.promise;
    }

    function _checkAlreadyLike(ach, userId) {
        var q = $q.defer();

        var fakeUser = new modelSvr.userInfo();
        fakeUser.id = userId;

        $q(function (rev, rej) {
            if (!currentUserLikesDirty) {
                rev(currentUserLikes);
            } else {
                var query = new AV.Query(modelSvr.likes);
                query.equalTo('liker', fakeUser);
                query.find().then(function (likes) {
                    currentUserLikes = likes;
                    currentUserLikesDirty = false;
                    rev(likes);
                }, function (err) {
                    rej(err);
                });
            }
        }).then(function (likes) {
            var r = _.findIndex(likes, function (l) {
                return l.get('ach').id === ach.id;
            });
            q.resolve(r !== -1);
        }, function (err) {
            q.reject(err);
        });
        return q.promise;
    }

    function _addComment(msg, userid, ach) {
        var q = $q.defer();
        roleSvr.getRoleByInfoId(userid).then(function (role) {
            if (role && role.get('roleType') === '1') {
                // add to mentors comments
                _addToMComment(msg, role, ach).then(function () {
                    q.resolve();
                }, function (err) {
                    q.reject(err);
                });
            }
            else {
                // add to normal comments
                _addToNormalComment(msg, userid, ach).then(function () {
                    q.resolve();
                }, function (err) {
                    q.reject(err);
                });
            }
        }, function (err) {
            q.reject(err);
        });
        return q.promise;
    }

    function _addToMComment(msg, role, ach) {
        var q = $q.defer();

        var query = new AV.Query(modelSvr.mComments);
        query.equalTo('userInfo', role.get('userInfo'));
        query.equalTo('ach', ach);
        query.first().then(function (mc) {
            if (!!mc) {
                mc.set('msg', msg);
                mc.save().then(function () {
                    q.resolve();
                }, function (err) {
                    q.reject(err);
                });
            }
            else {
                var mComment = new modelSvr.mComments();
                mComment.set('msg', msg);
                mComment.set('userInfo', role.get('userInfo'));
                mComment.set('ach', ach);
                mComment.save().then(function () {
                    q.resolve();
                }, function (err) {
                    q.reject(err);
                });
            }
        }, function (err) {
            if (err.code === 101)  // 不存在
            {
                var mComment = new modelSvr.mComments();
                mComment.set('msg', msg);
                mComment.set('userInfo', role.get('userInfo'));
                mComment.set('ach', ach);
                mComment.save().then(function () {
                    q.resolve();
                }, function (err) {
                    q.reject(err);
                });
            }
            else {
                q.reject(err);

            }
        });
        return q.promise;
    }

    function _addToNormalComment(msg, userid, ach) {


        var comment = new modelSvr.comments();
        comment.set('msg', msg);
        if (userid) {
            var userInfo = new modelSvr.userInfo();
            userInfo.id = userid;
            comment.set('userInfo', userInfo);
        }
        comment.set('ach', ach);
        return comment.save();
    }


    function _delComment() {

    }

    function _getAllmCommnets(ach) {
        var query = new AV.Query(modelSvr.mComments);
        query.equalTo('ach', ach);
        return query.find();
    }

    function _getAllCommnets(ach) {
        var query = new AV.Query(modelSvr.comments);
        query.equalTo('ach', ach);
        query.include('userInfo');
        return query.find();
    }

    function _getAllLikes(ach) {
        var query = new AV.Query(modelSvr.likes);
        query.equalTo('ach', ach);
        query.include('liker');
        return query.find();
    }

    function _countLikes(ach) {
        var query = new AV.Query(modelSvr.likes);
        query.equalTo('ach', ach);
        return query.count();
    }

    function _countComments(ach) {
        var query = new AV.Query(modelSvr.comments);
        query.equalTo('ach', ach);
        return query.count();
    }

    return {
        like: _like,
        undoLike: _undoLike,
        checkAlreadyLike: _checkAlreadyLike,
        addComment: _addComment,
        getAllmComments: _getAllmCommnets,
        getAllComments: _getAllCommnets,
        getAllLikes: _getAllLikes,
        countLikes: _countLikes,
        countComments: _countComments

    }

});

//
//serviceModule.directive('detailScrolling', function ($document, $rootScope, $timeout) {
//    return {
//        restrict: 'A',
//        link: function (scope, element, attrs) {
//            var startPos = scope.$eval(attrs.detailScrolling) || 0;
//            var currentPos = 0;
//            var dir = 0;
//            element.bind('scroll', function (e) {
//                if (e.detail.scrollTop >= currentPos) {
//                    if (dir < 1) {
//                        startPos = e.detail.scrollTop;
//                        $rootScope.$broadcast('endScrollingUp', startPos);
//                        $rootScope.$broadcast('startScrollingDown', startPos);
//                        dir = 1;
//                    }
//                    currentPos = e.detail.scrollTop;
//                    if (currentPos == 0) {
//                        startPos = 0;
//                    }
//                    var offset = startPos - currentPos;
//                    $rootScope.$broadcast('scrollingDown', offset);
//                } else {
//                    if (dir > -1) {
//                        startPos = e.detail.scrollTop;
//                        $rootScope.$broadcast('endScrollingDown', startPos);
//                        $rootScope.$broadcast('startScrollingUp', startPos);
//                        dir = -1;
//                    }
//                    currentPos = e.detail.scrollTop;
//                    var offset = startPos - currentPos;
//                    $rootScope.$broadcast('scrollingUp', offset);
//                }
//            });
//        }
//    }
//});


//angular.module('ionic.ion.headerShrink', [])

serviceModule.directive('headerShrink', function ($document) {
    var fadeAmt;

    var shrink = function (header, content, amt, max) {
        amt = Math.min(max, amt);
        fadeAmt = 1 - amt / max;
        ionic.requestAnimationFrame(function () {
            header.style[ionic.CSS.TRANSFORM] = 'translate3d(0, -' + amt + 'px, 0)';
            for (var i = 0, j = header.children.length; i < j; i++) {
                header.children[i].style.opacity = fadeAmt;
            }
        });
    };

    return {
        restrict: 'A',
        link: function ($scope, $element, $attr) {
            var starty = $scope.$eval($attr.headerShrink) || 0;
            var shrinkAmt;

            var amt;

            var y = 0;
            var prevY = 0;
            var scrollDelay = .8;

            var fadeAmt;

            var header = $document[0].body.querySelector('.detailHead');
            //var header = $document[0].body.querySelector('.bar-header');
            var headerHeight = header.offsetHeight;

            function onScroll(e) {
                var scrollTop = e.detail.scrollTop;

                if (scrollTop >= 0) {
                    y = Math.min(headerHeight / scrollDelay, Math.max(0, y + scrollTop - prevY));
                } else {
                    y = 0;
                }
                console.log(scrollTop + "#" + y);
                ionic.requestAnimationFrame(function () {
                    fadeAmt = 1 - (y / headerHeight);
                    header.style[ionic.CSS.TRANSFORM] = 'translate3d(0, ' + -y + 'px, 0)';
                    for (var i = 0, j = header.children.length; i < j; i++) {
                        header.children[i].style.opacity = fadeAmt;
                    }
                });

                prevY = scrollTop;
            }

            $element.bind('scroll', onScroll);
        }
    }
});