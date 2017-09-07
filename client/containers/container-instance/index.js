import React, {Component} from 'react';
import {findDOMNode} from 'react-dom';
import classname from 'classname';
import moment from 'moment';
import qs from 'querystring';
import {Link, browserHistory} from 'react-router';
import {Tabs, TabLink, TabContent} from 'react-tabs-redux';
import Sheet from '../../components/sheet';
import ContainerInstanceStats from '../../components/container-instance-stats';
import TasksList from '../../components/tasks-list';
import styles from './index.css';

const activeLinkStyle = {

  borderBottomColor: '#fff',
  color: '#54585E',
};

export default class ContainerInstance extends Component {
  constructor() {
    super()
    const hash = window.location.hash.slice(1)
    const map = qs.decode(hash)
    this.state = {
      tab: map.tab
    }
  }

  render() {
    return (
      <div className={styles.ContainerInstance}>
        <Sheet onClose={::this.closeSheet}>
          <h1 tabIndex="-1" ref="heading">{this.props.containerInstance.ec2InstanceId}</h1>
          <ContainerInstanceStats containerInstance={this.props.containerInstance} left={true} fullStats={true}/>
          <Tabs handleSelect={::this.selectTab} selectedTab={this.state.tab} className={styles.ContainerInstanceTabs}
                activeLinkStyle={activeLinkStyle}>
            <nav className={styles['ContainerInstanceTabs-navigation']}>
              <ul>
                <li>
                  <a href="#tab=task_def">
                    <TabLink to="tasks">Tasks</TabLink>
                  </a>
                </li>
              </ul>
            </nav>

            <div className={styles['ContainerInstanceTabs-content']}>
              <TabContent for="tasks">
                <TasksList
                  tasks={this.getContainerTasks()}
                  context="containerInstance"
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
    const clusterName = this.props.cluster.clusterName;
    browserHistory.push(`/${clusterName}`);
  }

  /**
   * Put focus in the sheet.
   */

  componentDidMount() {
    findDOMNode(this.refs.heading).focus();
  }

  /**
   * Get tasks for containerInstance
   */

  getContainerTasks() {
    const {tasks} = this.props.cluster;
    const {containerInstanceArn} = this.props.containerInstance;
    return tasks.filter(task => task.containerInstanceArn === containerInstanceArn);
  }
};
