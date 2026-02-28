stage('Deploy Blue') {
    steps {
        dir('k8s') {

            sh """
            sed -i 's|IMAGE_TAG|${IMAGE_TAG}|g' blue-deployment.yaml
            """

            sh "kubectl apply -f blue-deployment.yaml"
            sh "kubectl apply -f service.yaml"

            // Wait until blue is ready
            sh "kubectl rollout status deployment/swiggy-blue --timeout=120s"

            // Verify pods are running
            sh "kubectl get pods -l version=blue"
        }
    }
}

stage('Wait Before Green Deployment') {
    steps {
        echo "Waiting 60 seconds before deploying Green..."
        sleep(time: 60, unit: 'SECONDS')
    }
}

stage('Deploy Green') {
    steps {
        dir('k8s') {

            sh """
            sed -i 's|IMAGE_TAG|${IMAGE_TAG}|g' green-deployment.yaml
            """

            sh "kubectl apply -f green-deployment.yaml"

            // Wait for green to be ready
            sh "kubectl rollout status deployment/swiggy-green --timeout=120s"

            sh "kubectl get pods -l version=green"
        }
    }
}

stage('Switch Traffic to Green') {
    steps {
        sh """
        kubectl patch service swiggy-service \
        -p '{"spec":{"selector":{"app":"swiggy","version":"green"}}}'
        """
    }
}

stage('Verify Green Service') {
    steps {
        sh """
        echo "Checking service endpoints..."
        kubectl get endpoints swiggy-service
        kubectl get svc swiggy-service
        """
    }
}
