import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService, FrameworkService, ProgramsService, ContentService, NotificationService } from '@sunbird/core';
import { IUserProfile, ConfigService, ToasterService, ResourceService,} from '@sunbird/shared';
import { TelemetryService } from '@sunbird/telemetry';
import { IContentEditorComponentInput } from '../../interfaces';
import { ProgramStageService } from '../../../program/services';
import { HelperService } from '../../services/helper.service';
import { CollectionHierarchyService } from '../../services/collection-hierarchy/collection-hierarchy.service';
import { SourcingService } from '../../services';

import * as _ from 'lodash-es';
import { map} from 'rxjs/operators';

@Component({
  selector: 'app-question-set-editor',
  templateUrl: './question-set-editor.component.html',
  styleUrls: ['./question-set-editor.component.scss']
})
export class QuestionSetEditorComponent implements OnInit {
  @Input() questionSetEditorComponentInput: IContentEditorComponentInput;
  questionSetEditorInput: any;
  editorConfig: any;
  editorParams: any;
  private userProfile: IUserProfile;
  private deviceId: string;
  private buildNumber: string;
  private portalVersion: string;
  showLoader = true;
  public hierarchyConfig: any;
  public collectionDetails: any;
  public showQuestionEditor = false;
  public sessionContext: any;
  public programContext: any;
  public unitIdentifier: string;
  public telemetryPageId: string;

  constructor(private activatedRoute: ActivatedRoute, private userService: UserService,
    private telemetryService: TelemetryService, private configService: ConfigService,
    private frameworkService: FrameworkService, private programsService: ProgramsService, 
    private contentService: ContentService, public toasterService: ToasterService,
    private resourceService: ResourceService, private programStageService: ProgramStageService,
    private helperService: HelperService, private collectionHierarchyService: CollectionHierarchyService,
    private sourcingService: SourcingService, public router: Router, private notificationService: NotificationService,
    ) {
      const buildNumber = (<HTMLInputElement>document.getElementById('buildNumber'));
      const deviceId = (<HTMLInputElement>document.getElementById('deviceId'));
      this.deviceId = deviceId ? deviceId.value : '';
      this.buildNumber = buildNumber ? buildNumber.value : '1.0';
      this.portalVersion = buildNumber && buildNumber.value ? buildNumber.value.slice(0, buildNumber.value.lastIndexOf('.')) : '1.0';
     }

  ngOnInit() {
    this.questionSetEditorInput = this.questionSetEditorComponentInput;
    this.sessionContext  = _.get(this.questionSetEditorInput, 'sessionContext');
    this.telemetryPageId = _.get(this.sessionContext, 'telemetryPageDetails.telemetryPageId');
    this.programContext = _.get(this.questionSetEditorInput, 'programContext');
    this.unitIdentifier  = _.get(this.questionSetEditorInput, 'unitIdentifier');

    // this.telemetryPageId = _.get(this.questionSetEditorInput, 'telemetryPageDetails.telemetryPageId');
    // this.templateDetails  = _.get(this.questionSetEditorInput, 'templateDetails');
    // 
    this.editorParams = {
      questionSetId: _.get(this.questionSetEditorInput, 'contentId'),
    };
    this.userProfile = this.userService.userProfile;
    this.getCollectionDetails().subscribe(data => {
      this.collectionDetails = data.result.content;
      this.showQuestionEditor = this.collectionDetails.mimeType === 'application/vnd.sunbird.questionset' ? true : false;
      this.getFrameWorkDetails();
    });
  }

  // private setEditorContext() {
  //   this.editorConfig = {
  //     context: {
  //       user: {
  //         id: this.userService.userid,
  //         name : !_.isEmpty(this.userProfile.lastName) ? this.userProfile.firstName + ' ' + this.userProfile.lastName :
  //         this.userProfile.firstName,
  //         orgIds: this.userProfile.organisationIds,
  //         organisations: this.userService.orgIdNameMap
  //       },
  //       identifier: this.editorParams.questionSetId,
  //       mode: 'edit',
  //       authToken: '',
  //       sid: this.userService.sessionId,
  //       did: this.deviceId,
  //       uid: this.userService.userid,
  //       channel: this.userService.channel,
  //       pdata: {
  //         id: this.userService.appId,
  //         ver: this.portalVersion,
  //         pid: this.configService.appConfig.TELEMETRY.PID
  //       },
  //       contextRollUp: this.telemetryService.getRollUpData(this.userProfile.organisationIds),
  //       tags: this.userService.dims,
  //       cdata: [],
  //       timeDiff: this.userService.getServerTimeDiff,
  //       objectRollup: {},
  //       host: '',
  //       defaultLicense: this.frameworkService.getDefaultLicense(),
  //       endpoint: '/data/v3/telemetry',
  //       userData: {
  //         firstName: '',
  //         lastName: ''
  //       },
  //       env: 'question_set',
  //       framework: 'ekstep_ncert_k-12',
  //       aws_s3_urls : this.userService.cloudStorageUrls ||
  //       ['https://s3.ap-south-1.amazonaws.com/ekstep-public-qa/', 'https://ekstep-public-qa.s3-ap-south-1.amazonaws.com/',
  //       'https://dockstorage.blob.core.windows.net/sunbird-content-dock/']
  //     }
  //   };
  //   if (!_.isUndefined(this.userService.userProfile.firstName) && !_.isNull(this.userService.userProfile.firstName)) {
  //     this.editorConfig.context.userData.firstName = this.userService.userProfile.firstName;
  //   }
  //   if (!_.isUndefined(this.userService.userProfile.lastName) && !_.isNull(this.userService.userProfile.lastName)) {
  //     this.editorConfig.context.userData.lastName = this.userService.userProfile.lastName;
  //   }
  //   this.showLoader = false;
  // }


  private getCollectionDetails() {
    const options: any = { params: {} };
    options.params.mode = 'edit';
    const option = {
      url: `${this.configService.urlConFig.URLS.CONTENT.GET}/${this.editorParams.questionSetId}`,
      params: options
    };
    return this.contentService.get(option).pipe(map((response: any) => {return response}));
  }
  

  getFrameWorkDetails() {
    if (this.programContext.rootorg_id) {
      this.helperService.fetchChannelData(this.programContext.rootorg_id);
    }
    this.programsService.getCategoryDefinition(this.collectionDetails.primaryCategory, this.programContext.rootorg_id, 'QuestionSet')
    .subscribe(data => {
      // tslint:disable-next-line:max-line-length
      if (_.get(data, 'result.objectCategoryDefinition.objectMetadata.config')) {
        this.hierarchyConfig = _.get(data, 'result.objectCategoryDefinition.objectMetadata.config.sourcingSettings.collection');
        if (!_.isEmpty(this.hierarchyConfig.children)) {
          this.hierarchyConfig.children = this.getPrimaryCategoryData(this.hierarchyConfig.children);
        }
        if (!_.isEmpty(this.hierarchyConfig.hierarchy)) {
          _.forEach(this.hierarchyConfig.hierarchy, (hierarchyValue) => {
            if (_.get(hierarchyValue, 'children')) {
              hierarchyValue['children'] = this.getPrimaryCategoryData(_.get(hierarchyValue, 'children'));
            }
          });
        }
      }
      if (!this.showQuestionEditor) {
        this.setEditorConfig();
        this.editorConfig.context['framework'] = _.get(this.collectionDetails, 'framework');
        if (_.get(this.collectionDetails, 'primaryCategory') && _.get(this.collectionDetails, 'primaryCategory') !== 'Curriculum Course') {
          this.editorConfig.context['targetFWIds'] = _.get(this.collectionDetails, 'targetFWIds');
        }
        this.showLoader = false;
      } else {
        this.setEditorConfig();
        this.showLoader = false;
      }
    }, err => {
      this.toasterService.error(this.resourceService.messages.emsg.m0015);
    });
  }

  getPrimaryCategoryData(childrenData) {
    _.forEach(childrenData, (value, key) => {
      if (_.isEmpty(value)) {
        switch (key) {
          case 'Question':
            childrenData[key] = this.frameworkService['_channelData'].questionPrimaryCategories
            || this.configService.appConfig.WORKSPACE.questionPrimaryCategories;
            break;
          case 'Content':
            childrenData[key] = this.frameworkService['_channelData'].contentPrimaryCategories || [];
            break;
          case 'Collection':
            childrenData[key] = this.frameworkService['_channelData'].collectionPrimaryCategories || [];
            break;
          case 'QuestionSet':
            childrenData[key] = this.frameworkService['_channelData'].questionsetPrimaryCategories || [];
            break;
        }
      }
    });
    return childrenData;
  }

  setEditorConfig() {
    // tslint:disable-next-line:max-line-length
    const additionalCategories = _.merge(this.frameworkService['_channelData'].contentAdditionalCategories, this.frameworkService['_channelData'].collectionAdditionalCategories);
    this.editorConfig = {
      context: {
        identifier: this.editorParams.questionSetId,
        channel: this.userService.channel,
        authToken: '',
        sid: this.userService.sessionId,
        did: this.deviceId,
        uid: this.userService.userid,
        additionalCategories: additionalCategories,
        pdata: {
          id: this.userService.appId,
          ver: this.portalVersion,
          pid: 'sunbird-portal'
        },
        actor: {
          id: this.userService.userid || 'anonymous',
          type: 'User'
        },
        contextRollup: this.telemetryService.getRollUpData(this.userProfile.organisationIds),
        tags: this.userService.dims,
        timeDiff: this.userService.getServerTimeDiff,
        defaultLicense: this.frameworkService.getDefaultLicense(),
        endpoint: '/data/v3/telemetry',
        env: this.showQuestionEditor ? 'question_editor' : 'collection_editor',
        user: {
          id: this.userService.userid,
          orgIds: this.userProfile.organisationIds,
          organisations: this.userService.orgIdNameMap,
          name : !_.isEmpty(this.userProfile.lastName) ? this.userProfile.firstName + ' ' + this.userProfile.lastName :
          this.userProfile.firstName,
          isRootOrgAdmin: this.userService.userProfile.rootOrgAdmin
        },
        channelData: this.frameworkService['_channelData'],
        cloudStorageUrls : this.userService.cloudStorageUrls,
        labels: {
          submit_collection_btn_label: this.sessionContext.sampleContent ? this.resourceService.frmelmnts.btn.submit : this.resourceService.frmelmnts.btn.submitForReview,
          publish_collection_btn_label: this.resourceService.frmelmnts.btn.submitForApproval,
          sourcing_approve_collection_btn_label: this.resourceService.frmelmnts.btn.publishToConsume,
          reject_collection_btn_label: this.resourceService.frmelmnts.btn.requestChanges,
        }
      },
      config: {
        mode: this.getEditorMode(),
        setDefaultCopyRight: false
      }
    };
    if (this.showQuestionEditor) {
      this.editorConfig.context.framework = this.collectionDetails.framework || this.frameworkService['_channelData'].defaultFramework;
    }
    this.editorConfig.config = _.assign(this.editorConfig.config, this.hierarchyConfig);
  }

  private getEditorMode() {
    const contentStatus = this.collectionDetails.status.toLowerCase();
    const submissionDateFlag = this.programsService.checkForContentSubmissionDate(this.programContext);

    // If loggedin user is a contentCreator and content status is draft
    if (submissionDateFlag && this.canSubmit()) {
      return 'edit';
    }
    
    if (submissionDateFlag && this.canReviewContent()) {
      return 'review';
    }
      
    if (this.canSourcingReviewerPerformActions()) {
      return 'sourcingReview';
    }

    return 'read';
  }

  canSourcingReviewerPerformActions() {
    const resourceStatus = this.collectionDetails.status.toLowerCase();
    const sourcingReviewStatus = _.get(this.questionSetEditorInput, 'sourcingStatus') || '';
    const originCollectionData = _.get(this.questionSetEditorInput, 'originCollectionData');
    const selectedOriginUnitStatus = _.get(this.questionSetEditorInput, 'content.originUnitStatus');

    // tslint:disable-next-line:max-line-length
    return !!(this.router.url.includes('/sourcing')
    && !this.collectionDetails.sampleContent === true && resourceStatus === 'live'
    && this.userService.userid !== this.collectionDetails.createdBy
    && resourceStatus === 'live' && !sourcingReviewStatus &&
    (originCollectionData.status === 'Draft' && selectedOriginUnitStatus === 'Draft')
    && this.programsService.isProjectLive(this.programContext));
  }

  canReviewContent() {
    const resourceStatus = this.collectionDetails.status.toLowerCase();

    // tslint:disable-next-line:max-line-length
    return !!(this.router.url.includes('/contribute') && !this.collectionDetails.sampleContent === true && this.hasAccessFor(['REVIEWER']) && resourceStatus === 'review' && this.userService.userid !== this.collectionDetails.createdBy);
  }

  canSubmit() {
    const resourceStatus = this.collectionDetails.status.toLowerCase();
    // tslint:disable-next-line:max-line-length
    return !!(this.hasAccessFor(['CONTRIBUTOR']) && resourceStatus === 'draft' && this.userService.userid === this.collectionDetails.createdBy);
  }

  hasAccessFor(roles: Array<string>) {
    return !_.isEmpty(_.intersection(roles, this.sessionContext.currentRoles || []));
  }

  editorEventListener(event) {
   console.log(event);
   switch (event.action) {
    case "submitContent" : 
      // collection is sent for review. If individual contributor or contributor of default org and review is disabled publish the content
      if (this.helperService.isIndividualAndNotSample(this.sessionContext.currentOrgRole, this.sessionContext.sampleContent)) {
        this.publishQuestionSet(event.identifier);
      }
      else {
       this.programStageService.removeLastStage();
      }
      break;
    case "sendForCorrections": 
      this.requestCorrectionsBySourcing(event.identifier, event.comment)
      break;
    case "sourcingApprove":
      this.helperService.manageSourcingActions('accept', this.sessionContext, this.unitIdentifier, this.collectionDetails);
      break;
    case "sourcingReject": 
      this.helperService.manageSourcingActions('reject', this.sessionContext, this.unitIdentifier, this.collectionDetails, event.comment);
      break;
    case "saveCollection": // saving as draft
    default: this.programStageService.removeLastStage();
      break;
   }
  }

  publishQuestionSet(identifier) {
    this.helperService.publishQuestionSet(identifier, this.userService.userProfile.userId)
       .subscribe(res => {
        if (this.sessionContext.collection && this.questionSetEditorInput.unitIdentifier) {
          // tslint:disable-next-line:max-line-length
          this.collectionHierarchyService.addResourceToHierarchy(this.sessionContext.collection, this.questionSetEditorInput.unitIdentifier, res.result.node_id || res.result.identifier || res.result.content_id)
          .subscribe((data) => {
            this.toasterService.success(this.resourceService.messages.smsg.contentAcceptMessage.m0001);
            this.programStageService.removeLastStage();
          });
        }
      }, (err) => {
        const errInfo = {
          errorMsg: this.resourceService.messages.fmsg.m00102,
          telemetryPageId: this.telemetryPageId, telemetryCdata : _.get(this.sessionContext, 'telemetryPageDetails.telemetryInteractCdata'),
          env : this.activatedRoute.snapshot.data.telemetry.env
        };
        this.sourcingService.apiErrorHandling(err, errInfo);
      });
  }

  requestCorrectionsBySourcing(questionsetId, rejectComment) {
    if (rejectComment) {
      this.helperService.updateQuestionSetStatus(questionsetId, "Draft", rejectComment)
      .subscribe(res => {
        this.contentStatusNotify('Reject');
        this.toasterService.success(this.resourceService.messages.smsg.m0069);
        this.programStageService.removeLastStage();
      }, (err) => {
        const errInfo = {
          errorMsg: this.resourceService.messages.fmsg.m00106,
          telemetryPageId: this.telemetryPageId, telemetryCdata : _.get(this.sessionContext, 'telemetryPageDetails.telemetryInteractCdata'),
          env : this.activatedRoute.snapshot.data.telemetry.env
        };
        this.sourcingService.apiErrorHandling(err, errInfo);
      });
    }
  }

  contentStatusNotify(status) {
    if (!this.sessionContext.nominationDetails && this.collectionDetails.organisationId && status !== 'Request') {
      const programDetails = { name: this.programContext.name};
      this.helperService.prepareNotificationData(status, this.collectionDetails, programDetails);
    } else {
      const notificationForContributor = {
        user_id: this.collectionDetails.createdBy,
        content: { name: this.collectionDetails.name },
        org: { name:  _.get(this.sessionContext, 'nominationDetails.orgData.name') || '--'},
        program: { name: this.programContext.name },
        status: status
      };
      this.notificationService.onAfterContentStatusChange(notificationForContributor)
      .subscribe((res) => {  });
      if (!_.isEmpty(this.sessionContext.nominationDetails) && !_.isEmpty(this.sessionContext.nominationDetails.user_id) && status !== 'Request') {
        const notificationForPublisher = {
          user_id: this.sessionContext.nominationDetails.user_id,
          content: { name: this.collectionDetails.name },
          org: { name:  this.sessionContext.nominationDetails.orgData.name},
          program: { name: this.programContext.name },
          status: status
        };
        this.notificationService.onAfterContentStatusChange(notificationForPublisher)
        .subscribe((res) => {  });
      }
    }
  }
}