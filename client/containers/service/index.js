import React, {Component} from 'react';
import {findDOMNode} from 'react-dom';
import classname from 'classname';
import moment from 'moment';
import qs from 'querystring';
import {Link, browserHistory} from 'react-router';
import {Tabs, TabLink, TabContent} from 'react-tabs-redux';
import Sheet from '../../components/sheet';
import ServiceEventList from '../../components/service-event-list';
import ServiceStats from '../../components/service-stats';
import ServiceTaskDef from '../../components/service-task-def';
import TasksList from '../../components/tasks-list';
import styles from './index.css';

const activeLinkStyle = {
  borderBottomColor: '#fff',
  color: '#54585E',
};

export default class Service extends Component {
  constructor() {
    super()
    const hash = window.location.hash.slice(1)
    const map = qs.decode(hash)
    this.state = {
      tab: map.tab
    }
  }

  render() {
    const {service} = this.props;
    return (
      <div className={styles.Service}>
        <Sheet onClose={::this.closeSheet}>
          <h1 tabIndex="-1" ref="heading">{service.serviceName}</h1>
          <ServiceStats service={service} left={true} fullStats={true}/>
          <Tabs handleSelect={::this.selectTab} selectedTab={this.state.tab} className={styles.ServiceTabs}
                activeLinkStyle={activeLinkStyle}>
            <nav className={styles['ServiceTabs-navigation']}>
              <ul>
                <li>
                  <a href="#tab=task_def">
                    <TabLink to="task_def">Task Def</TabLink>
                  </a>
                </li>
                <li>
                  <a href="#tab=events">
                    <TabLink to="events">Events</TabLink></a>
                </li>
                <li>
                  <a href="#tab=tasks">
                    <TabLink to="tasks">tasks</TabLink>
                  </a>
                </li>
              </ul>
            </nav>

            <div className={styles['ServiceTabs-content']}>
              <TabContent for="events">
                <ServiceEventList events={service.events}/>
              </TabContent>
              <TabContent for="task_def">
                <ServiceTaskDef
                  family={service.taskDef.family}
                  revision={service.taskDef.revision}
                  definition={service.taskDef.containerDefinitions[0]}/></TabContent>
              <TabContent for="tasks">
                <TasksList
                  tasks={this.getServiceTasks()}
                  context="service"
                  cluster={this.props.cluster}
                />
              </TabContent>
            </div>
          </Tabs>
        </Sheet>
      </div>
    );
  }

  /**
   * Select the given `tab`.
   */

  selectTab(tab) {
    this.setState({tab: tab})
  }

  /**
   * Close the sheet.
   */

  closeSheet() {
    const {service} = this.props;
    const clusterName = service.clusterArn.split('cluster/')[1];
    browserHistory.push(`/${clusterName}`);
  }

  /**
   * Put focus in the sheet.
   */

  componentDidMount() {
    findDOMNode(this.refs.heading).focus();
  }

  /**
   * Get tasks for service
   */

  getServiceTasks() {
    const {tasks} = this.props.cluster;
    const {serviceName} = this.props.service;
    return tasks.filter(task => task.group === `service:${serviceName}`);
  }
};