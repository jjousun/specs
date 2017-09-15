
import React, { Component } from 'react';
import moment from 'moment';
import classname from 'classname';
import styles from './index.css';

export default class ServiceTaskDef extends Component {
  static contextTypes = {
    awsConfig: React.PropTypes.object.isRequired
  };

  render() {
    const { family, revision, definition } = this.props;
    const command = definition.command ? definition.command.join(' ') : null;

    const { region } = this.context.awsConfig;
    const url = `https://${region}.console.aws.amazon.com/ecs/home?region=${region}#/taskDefinitions/${family}/${revision}`;

    return (
      <div className={styles.ServiceTaskDef}>
        <table>
          <tbody>
            <tr>
              <th>task def</th>
              <td><a href={url} target="_blank">{family}:{revision}</a></td>
            </tr>
            <tr>
              <th>CPU</th>
              <td>{definition.cpu}</td>
            </tr>
            <tr>
              <th>memory</th>
              <td>{definition.memory}</td>
            </tr>
            <tr>
              <th>command</th>
              <td>
                <code>{command}</code>
              </td>
            </tr>
            <tr>
              <th>environment</th>
              <td>
                <ul className={styles.ServiceTaskDefEnvVars}>
                  {definition.environment.map(({ name, value }) =>
                    <li key={`__${family}_${revision}_env_${name}`}><code>{name}={value}</code></li>
                  )}
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
};
