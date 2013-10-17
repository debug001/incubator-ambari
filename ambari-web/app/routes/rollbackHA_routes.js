/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var App = require('app');

module.exports = Em.Route.extend({
  route: '/highAvailability/rollbackHA',

  enter: function (router) {
    Em.run.next(function () {
      var rollbackHighAvailabilityWizardController = router.get('rollbackHighAvailabilityWizardController');
      App.router.get('updateController').set('isWorking', false);
      var popup = App.ModalPopup.show({
        classNames: ['full-width-modal'],
        header: Em.I18n.t('admin.highAvailability.wizard.rollback.header.title'),
        bodyClass: App.RollbackHighAvailabilityWizardView.extend({
          controller: rollbackHighAvailabilityWizardController
        }),
        primary: Em.I18n.t('form.cancel'),
        showFooter: false,
        secondary: null,
        hideCloseButton: function () {
          this.set('showCloseButton', false);
        }.observes('App.router.rollbackHighAvailabilityWizardController.currentStep'),

        onClose: function () {
          this.hide();
          App.router.get('rollbackHighAvailabilityWizardController').setCurrentStep('1');
          App.router.get('updateController').set('isWorking', true);
          App.router.transitionTo('main.admin.adminHighAvailability');
        },
        didInsertElement: function () {
          this.fitHeight();
        }
      });
      rollbackHighAvailabilityWizardController.set('popup', popup);
      App.clusterStatus.updateFromServer();
      var currentClusterStatus = App.clusterStatus.get('value');
      if (currentClusterStatus) {
        switch (currentClusterStatus.clusterState) {
          case 'ROLLBACK_HIGH_AVAILABILITY' :
            App.db.data = currentClusterStatus.localdb;
            rollbackHighAvailabilityWizardController.setCurrentStep(currentClusterStatus.localdb.RollbackHighAvailabilityWizard.currentStep);
            break;
          default:
            var currStep = App.router.get('rollbackHighAvailabilityWizardController.currentStep');
            rollbackHighAvailabilityWizardController.setCurrentStep(currStep);
            break;
        }
      }
      router.transitionTo('step' + rollbackHighAvailabilityWizardController.get('currentStep'));
    });
  },

  step1: Em.Route.extend({
    route: '/step1',
    connectOutlets: function (router) {
      var controller = router.get('rollbackHighAvailabilityWizardController');
      controller.setCurrentStep('1');
      controller.dataLoading().done(function () {
        controller.loadAllPriorSteps();
        controller.connectOutlet('rollbackHighAvailabilityWizardStep1', controller.get('content'));
      })
    },
    unroutePath: function () {
      return false;
    },
    next: function (router) {
      router.transitionTo('step2');
    }
  }),

  step2: Em.Route.extend({
    route: '/step2',
    connectOutlets: function (router) {
      var controller = router.get('rollbackHighAvailabilityWizardController');
      App.clusterStatus.setClusterStatus({
        clusterName: router.get('content.cluster.name'),
        clusterState: 'ROLLBACK_HIGH_AVAILABILITY',
        wizardControllerName: 'rollbackHighAvailabilityWizardController',
        localdb: App.db.data
      });
      controller.setCurrentStep('2');
      controller.dataLoading().done(function () {
        controller.loadAllPriorSteps();
        controller.connectOutlet('rollbackHighAvailabilityWizardStep2', controller.get('content'));
      })
    },
    unroutePath: function () {
      return false;
    },
    next: function (router) {
      router.transitionTo('step3');
    },
    back: function (router) {
      router.transitionTo('step1');
    }
  }),

  step3: Em.Route.extend({
    route: '/step3',
    connectOutlets: function (router) {
      var controller = router.get('rollbackHighAvailabilityWizardController');
      controller.setCurrentStep('3');
      controller.setLowerStepsDisable(3);
      App.clusterStatus.setClusterStatus({
        clusterName: router.get('content.cluster.name'),
        clusterState: 'ROLLBACK_HIGH_AVAILABILITY',
        wizardControllerName: 'rollbackHighAvailabilityWizardController',
        localdb: App.db.data
      });
      controller.dataLoading().done(function () {
        controller.loadAllPriorSteps();
        controller.connectOutlet('rollbackHighAvailabilityWizardStep3',  controller.get('content'));
      })
    },
    unroutePath: function () {
      return false;
    },
    next: function (router) {
      var controller = router.get('rollbackHighAvailabilityWizardController');
      controller.clearTasksData();
      controller.clearStorageData();
      controller.finish();
      controller.get('popup').hide();
      App.router.get('updateController').set('isWorking', true);
      App.clusterStatus.setClusterStatus({
        clusterName: router.get('content.cluster.name'),
        clusterState: 'HIGH_AVAILABILITY_DISABLED',
        wizardControllerName: 'rollbackHighAvailabilityWizardController',
        localdb: App.db.data
      });
      router.transitionTo('main.index');
      location.reload();
    }
  }),

  gotoStep1: Em.Router.transitionTo('step1'),

  gotoStep2: Em.Router.transitionTo('step2'),

  gotoStep3: Em.Router.transitionTo('step3')

});